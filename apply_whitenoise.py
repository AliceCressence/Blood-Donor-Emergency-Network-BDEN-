import os
import glob

# Ensure WhiteNoise and Static configuring are applied correctly
for path in glob.glob("services/*/config/settings/base.py"):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add WhiteNoise Middleware if missing
    if "whitenoise.middleware.WhiteNoiseMiddleware" not in content:
        content = content.replace(
            '"django.middleware.security.SecurityMiddleware",',
            '"django.middleware.security.SecurityMiddleware",\n    "whitenoise.middleware.WhiteNoiseMiddleware",'
        )

    # Add Static Root and URL if missing
    if "STATIC_ROOT = BASE_DIR" not in content:
        content += "\nSTATIC_URL = '/static/'\nSTATIC_ROOT = BASE_DIR / 'staticfiles'\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Applied WhiteNoise middleware and static configuration to all services.")