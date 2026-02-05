"""
File size validators for uploaded files.
"""
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_image_size(file):
    """
    Validate that an image file does not exceed the maximum allowed size.
    
    Args:
        file: The uploaded file object
        
    Raises:
        ValidationError: If file size exceeds MAX_IMAGE_SIZE_MB
    """
    max_size_mb = getattr(settings, 'MAX_IMAGE_SIZE_MB', 5)
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file.size > max_size_bytes:
        raise ValidationError(
            f'Image file size cannot exceed {max_size_mb} MB. '
            f'Your file is {file.size / (1024 * 1024):.2f} MB.'
        )


def validate_document_size(file):
    """
    Validate that a document file does not exceed the maximum allowed size.
    
    Args:
        file: The uploaded file object
        
    Raises:
        ValidationError: If file size exceeds MAX_DOCUMENT_SIZE_MB
    """
    max_size_mb = getattr(settings, 'MAX_DOCUMENT_SIZE_MB', 10)
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file.size > max_size_bytes:
        raise ValidationError(
            f'Document file size cannot exceed {max_size_mb} MB. '
            f'Your file is {file.size / (1024 * 1024):.2f} MB.'
        )
