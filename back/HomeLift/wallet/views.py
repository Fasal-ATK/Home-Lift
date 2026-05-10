from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal
import stripe
from django.conf import settings
from .models import Wallet, WalletTransaction, WithdrawalRequest
from .serializers import WalletSerializer, WithdrawalRequestSerializer, TransactionSerializer
from providers.models import ProviderDetails
from notifications.utils import send_user_notification
from core.permissions import IsAdminUserCustom
import logging

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet_type = request.query_params.get('type', 'user')
        if wallet_type not in dict(Wallet.WALLET_TYPES):
            return Response({'detail': 'Invalid wallet type.'}, status=status.HTTP_400_BAD_REQUEST)
            
        wallet, created = Wallet.objects.get_or_create(
            user=request.user, 
            wallet_type=wallet_type
        )
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

class WalletWithdrawalView(APIView):
    """POST → request a withdrawal. For now, it transfers from platform to connected account."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount_str = request.data.get('amount')
        if not amount_str:
            return Response({'detail': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = Decimal(str(amount_str))
        except:
            return Response({'detail': 'Invalid amount format.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'detail': 'Amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify Provider Profile
        try:
            provider_details = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({'detail': 'Only providers can withdraw funds.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Ensure Stripe account is linked (Optional in DEBUG mode for simplicity)
        if not provider_details.stripe_account_id:
            if settings.DEBUG:
                provider_details.stripe_account_id = "acct_MOCK_DEVELOPMENT"
                provider_details.save()
            else:
                return Response({'detail': 'Please connect your Stripe account first.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check Wallet & Available Balance (Current - Other Pending)
        try:
            wallet = Wallet.objects.get(user=request.user, wallet_type='provider')
        except Wallet.DoesNotExist:
            return Response({'detail': 'Provider wallet not found.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.db.models import Sum
        pending_total = WithdrawalRequest.objects.filter(
            provider=request.user, 
            status='pending'
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        if (wallet.balance - pending_total) < amount:
            return Response({'detail': f'Insufficient available balance. (Pending: ₹{pending_total})'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Process Withdrawal Request (Atomic)
        try:
            with transaction.atomic():
                # a. Create Withdrawal Record
                withdrawal = WithdrawalRequest.objects.create(
                    provider=request.user,
                    wallet=wallet,
                    amount=amount,
                    status='pending'
                )
                
                # b. Record Pending Transaction (Balance remains intact for now)
                WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=amount,
                    transaction_type='debit',
                    status='pending',
                    description=f'Withdrawal Request #{withdrawal.id} (Pending Approval)'
                )

                # Send real-time notification
                send_user_notification(request.user.id, f"Withdrawal request of ₹{amount} submitted. Awaiting admin approval.")

            return Response(WithdrawalRequestSerializer(withdrawal).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """List provider's withdrawals."""
        withdrawals = WithdrawalRequest.objects.filter(provider=request.user).order_by('-created_at')
        serializer = WithdrawalRequestSerializer(withdrawals, many=True)
        return Response(serializer.data)

class StripeConnectLinkView(APIView):
    """
    Creates a Stripe Connect account link for the provider.
    This is for 'developing' a real onboarding flow.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            provider_details = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({"detail": "Only providers can connect Stripe."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Create a Connected Account if one doesn't exist
        if not provider_details.stripe_account_id:
            # DEVELOPMENT MOCK BYPASS: If you're testing with CLI/No Connect setup
            if settings.DEBUG and request.data.get('mock'):
                provider_details.stripe_account_id = "acct_MOCK_FOR_TESTING"
                provider_details.save()
                send_user_notification(request.user.id, "Stripe Account linked successfully (MOCK)!")
                return Response({"url": f"{origin}/provider/wallet?stripe=success", "mock": True})

            try:
                account = stripe.Account.create(
                    type="express",
                    # country="IN", # Dynamic or based on provider location
                    email=request.user.email,
                    capabilities={
                        "card_payments": {"requested": True},
                        "payouts": {"requested": True},
                    },
                )
                provider_details.stripe_account_id = account.id
                provider_details.save()
            except stripe.error.StripeError as e:
                logger.error(f"Stripe account creation failed for user {request.user.id}: {e}")
                return Response({"detail": f"Stripe Account Error: {e.user_message or str(e)}"}, status=400)
            except Exception as e:
                logger.exception(f"Unexpected error creating Stripe account for user {request.user.id}: {e}")
                return Response({"detail": f"Failed to create Stripe account: {str(e)}"}, status=400)

        # 2. Create an Account Link (onboarding URL)
        # In a real app, these should be your actual frontend URLs
        origin = request.headers.get('Origin', 'http://localhost:5173')
        try:
            account_link = stripe.AccountLink.create(
                account=provider_details.stripe_account_id,
                refresh_url=f"{origin}/provider/wallet?stripe=refresh",
                return_url=f"{origin}/provider/wallet?stripe=success",
                type="account_onboarding",
            )
            return Response({"url": account_link.url})
        except stripe.error.StripeError as e:
            return Response({"detail": f"Stripe Link Error: {e.user_message or str(e)}"}, status=400)
        except Exception as e:
            return Response({"detail": f"System Error: {str(e)}"}, status=400)


class AdminWithdrawalListView(APIView):
    """GET list of all withdrawals for admin."""
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        withdrawals = WithdrawalRequest.objects.all().order_by('-created_at')
        status_param = request.query_params.get('status')
        if status_param:
            withdrawals = withdrawals.filter(status=status_param)
        serializer = WithdrawalRequestSerializer(withdrawals, many=True)
        return Response(serializer.data)


class AdminWithdrawalActionView(APIView):
    """PATCH to approve or reject a withdrawal."""
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, pk):
        try:
            withdrawal = WithdrawalRequest.objects.get(pk=pk)
        except WithdrawalRequest.DoesNotExist:
            return Response({'detail': 'Withdrawal record not found'}, status=status.HTTP_404_NOT_FOUND)

        if withdrawal.status != 'pending':
            return Response({'detail': 'Can only modify pending withdrawals.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action') # 'approve' or 'reject'
        if action not in ['approve', 'reject']:
            return Response({'detail': 'Action must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        wallet = withdrawal.wallet
        try:
            provider_details = ProviderDetails.objects.get(user=withdrawal.provider)
        except ProviderDetails.DoesNotExist:
            return Response({'detail': 'Provider profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                if action == 'approve':
                    # 1. Deduct balance ONLY now
                    if wallet.balance < withdrawal.amount:
                         return Response({'detail': 'Insufficient balance at time of approval.'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    wallet.balance -= withdrawal.amount
                    wallet.save()

                    # 2. Update/Create Transaction
                    # Find the pending transaction and mark it completed
                    txn = WalletTransaction.objects.filter(
                        wallet=wallet, 
                        amount=withdrawal.amount, 
                        status='pending',
                        transaction_type='debit'
                    ).first()
                    if txn:
                        txn.status = 'completed'
                        txn.description = f'Withdrawal Request #{withdrawal.id} Approved'
                        txn.save()
                    else:
                        WalletTransaction.objects.create(
                            wallet=wallet,
                            amount=withdrawal.amount,
                            transaction_type='debit',
                            status='completed',
                            description=f'Withdrawal Request #{withdrawal.id} Approved'
                        )

                    # 3. Admin Process (Stripe etc)
                    if settings.DEBUG and provider_details.stripe_account_id.startswith("acct_MOCK"):
                        withdrawal.stripe_transfer_id = "tr_MOCK_ADMIN_APPROVED"
                        withdrawal.status = 'completed'
                    else:
                        try:
                            transfer = stripe.Transfer.create(
                                amount=int(withdrawal.amount * 100),
                                currency='inr',
                                destination=provider_details.stripe_account_id,
                                description=f"Withdrawal request #{withdrawal.id} for {withdrawal.provider.email}"
                            )
                            withdrawal.stripe_transfer_id = transfer.id
                            withdrawal.status = 'completed'
                        except stripe.error.StripeError as e:
                            # Rollback DB if Stripe fails
                            raise Exception(f'Stripe Error: {e.user_message or str(e)}')
                    
                    withdrawal.save()
                    send_user_notification(withdrawal.provider.id, f"Your withdrawal of ₹{withdrawal.amount} has been approved and processed!")

                elif action == 'reject':
                    withdrawal.status = 'failed'
                    withdrawal.save()
                    
                    # Update pending transaction to failed
                    txn = WalletTransaction.objects.filter(
                        wallet=wallet, 
                        amount=withdrawal.amount, 
                        status='pending',
                        transaction_type='debit'
                    ).first()
                    if txn:
                        txn.status = 'failed'
                        txn.description = f'Withdrawal Request #{withdrawal.id} Rejected'
                        txn.save()

                    send_user_notification(withdrawal.provider.id, f"Your withdrawal request of ₹{withdrawal.amount} was rejected.")

            return Response(WithdrawalRequestSerializer(withdrawal).data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
