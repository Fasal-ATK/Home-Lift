from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('providers', '0012_alter_providerapplication_id_doc_and_more'),
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProviderServiceRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('price', models.DecimalField(blank=True, decimal_places=2, help_text='Custom price requested by the provider (optional)', max_digits=10, null=True)),
                ('experience_years', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=10)),
                ('rejection_reason', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('replied_at', models.DateTimeField(blank=True, null=True)),
                ('provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_requests', to='providers.providerdetails')),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='provider_requests', to='services.service')),
            ],
            options={
                'verbose_name': 'Provider Service Request',
                'verbose_name_plural': 'Provider Service Requests',
                'ordering': ['-created_at'],
                'unique_together': {('provider', 'service', 'status')},
            },
        ),
    ]
