
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests
    print("Google Auth libraries are installed.")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
