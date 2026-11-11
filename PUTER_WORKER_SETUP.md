# Puter Worker Setup Guide

This guide will help you set up the serverless backend for Room AI Interior Design on [Puter.com](https://puter.com/).

## Prerequisites

- A [Puter.com](https://puter.com/) account.
- Basic familiarity with copying and pasting code.

## Step-by-Step Instructions

### 1. Access the Puter Dashboard

Sign in to your account at [Puter.com](https://puter.com/). You will see a desktop-like environment ("Internet OS").

### 2. Open the Workers App

Click on the **"Workers"** icon on the desktop. This will open the Workers management dashboard.

### 3. Create a New Worker

1. Click the **"New Worker"** button.
2. Give your worker a descriptive name, such as `room-ai-worker`.
3. Choose **"JavaScript"** as the language if prompted.

### 4. Deploy the Backend Code

1. In your local project, open the file [**`lib/puter.worker.js`**](./lib/puter.worker.js).
2. Copy the entire content of that file.
3. In the Puter worker editor, paste the code, replacing any default content.
4. Click the **"Save & Deploy"** button.

### 5. Get Your Worker URL

1. Once deployed, find the **"URL"** section in the worker settings.
2. Ensure the worker is set to **"Public"**.
3. Copy the URL (it should look like `https://xxx.puter.worker.id/`).

### 6. Update Your `.env` File

Paste the URL you just copied into your local `.env` file:

```env
VITE_PUTER_WORKER_URL="https://xxx.puter.worker.id/"
```

Now you're all set! Your local frontend will communicate with your new Puter backend.
