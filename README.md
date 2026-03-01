<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11vA6h21x7QNWdt52Z9PyQ7M0vQgciLRp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Bind Custom Domain + HTTPS (Nginx)

If your app is already running on server port `3000`, you can bind `remuse.top` and enable HTTPS with one command.

### 1) DNS (domain console)

- Add `A` record: `@` -> your server public IP
- Add `A` record: `www` -> your server public IP

### 2) Open ports

- Open inbound `80` and `443` in cloud security group / firewall

### 3) Run script on your Linux server

```bash
bash deploy-domain-ssl.sh remuse.top your-email@example.com 3000
```

After success:

- https://remuse.top
- https://www.remuse.top (will redirect to HTTPS)

If you need a manual config, see [deploy/nginx-domain-template.conf](deploy/nginx-domain-template.conf).
