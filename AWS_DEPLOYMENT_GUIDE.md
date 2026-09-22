# Comprehensive AWS Deployment Guide
## Cloud-Based Expense Tracker (B.Tech Mini-Project)

This guide provides step-by-step instructions for deploying the **Cloud-Based Expense Tracker** to production using Amazon Web Services (AWS) and MongoDB Atlas.

---

## 🏛️ Deployment Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / USER                                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
     HTTPS: Loads React Frontend               HTTPS: REST API Calls
                 │                                       │
                 ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     AWS S3 STATIC HOSTING       │     │     AWS ELASTIC BEANSTALK       │
│  Bucket: `expense-tracker-ui`   │     │  Environment: Python 3.10+ / AL │
│  - Single Page App (SPA)        │     │  - FastAPI + Uvicorn (port 5000)│
│  - Index & Error: `index.html`  │     │  - Nginx Reverse Proxy          │
└─────────────────────────────────┘     └────────────────┬────────────────┘
                                                         │
                                               TLS Encrypted SCRAM-SHA-1
                                                         │
                                                         ▼
                                        ┌─────────────────────────────────┐
                                        │       MONGODB ATLAS CLOUD       │
                                        │  - Cluster M0 / Serverless      │
                                        │  - DB: `expense_tracker`        │
                                        └─────────────────────────────────┘
```

---

## 📋 Prerequisites Checklist

1. **AWS Account**: Active AWS account with permissions for Elastic Beanstalk, EC2, and S3.
2. **MongoDB Atlas Account**: Configured database cluster (`expense_tracker`).
3. **Local Tools** (Optional but recommended):
   - [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) installed and configured with `aws configure`.
   - [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) (`pip install awsebcli`).

---

## 🌐 Phase 1: MongoDB Atlas Network Configuration

Elastic Beanstalk assigns dynamic IP addresses to EC2 instances unless configured inside a custom VPC with a NAT Gateway. To allow Elastic Beanstalk instances to connect to MongoDB Atlas:

1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. In the left navigation, select **Network Access**.
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Set a description: `Allow AWS Elastic Beanstalk`.
6. Click **Confirm**.
7. In **Database Access**, ensure your database user credentials (username & password) are ready.

---

## 🚀 Phase 2: Deploy Backend to AWS Elastic Beanstalk

### Method A: Using AWS Management Console (Easiest for Beginners)

#### Step 1: Package Backend Code into a ZIP file
In your local project terminal:
```bash
cd backend
# Exclude venv, __pycache__, .env, and local test artifacts
# On Windows PowerShell:
Compress-Archive -Path app, .ebextensions, .platform, application.py, main.py, Procfile, requirements.txt -DestinationPath backend_deploy.zip -Force
```

#### Step 2: Create Elastic Beanstalk Application
1. Open the [AWS Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/).
2. Select your preferred AWS Region (e.g., `us-east-1` (N. Virginia) or `ap-south-1` (Mumbai)).
3. Click **Create application**.
4. Configure Application:
   - **Application Name**: `expense-tracker-api`
5. Configure Environment:
   - **Environment tier**: *Web server environment*
   - **Platform**: *Python*
   - **Platform branch**: *Python 3.11 running on 64bit Amazon Linux 2023* (or Python 3.10)
   - **Application code**: Select **Upload your code**
   - **Source code origin**: Choose **Local file** and upload `backend_deploy.zip`
   - **Version label**: `v1.0.0`
   - **Presets**: Select **Single instance (free tier eligible)**
6. Click **Next**.

#### Step 3: Configure Service Access & Permissions
1. Under **Service role**, select **Use an existing service role** (or let AWS create `aws-elasticbeanstalk-service-role`).
2. Under **EC2 key pair**, select an existing key pair or leave blank if you do not need SSH.
3. Under **EC2 instance profile**, select `aws-elasticbeanstalk-ec2-role` (with `AWSElasticBeanstalkWebTier` policy).
4. Click **Next**.

#### Step 4: Configure Networking & Instance
- You can accept the default VPC and public subnets.
- Click **Next**.

#### Step 5: Configure Environment Variables (Crucial Step!)
1. Scroll down to **Environment properties**.
2. Add the following environment variables (do not expose these publicly):
   | Property Name | Property Value | Example / Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | *Your connection string* | `mongodb+srv://user:password@cluster.mongodb.net/?appName=expense-tracker` |
   | `DATABASE_NAME` | `expense_tracker` | Name of MongoDB database |
   | `JWT_SECRET` | *Strong random string* | `e7f9a82b4c10567e9f3b5c8a2d1e0f4a` |
   | `JWT_ALGORITHM`| `HS256` | Token hashing algorithm |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime (24 hours) |
   | `CORS_ORIGINS` | `*` | Temporary wildcard (replace with your S3 URL in Phase 4) |
   | `PORT` | `5000` | Port expected by Elastic Beanstalk proxy |
3. Click **Next**, review summary, and click **Submit**.
4. AWS will take 3–5 minutes to provision EC2, Nginx, security groups, and launch the application.

---

### Step 3: Verify the Live Backend API
Once the Elastic Beanstalk environment status turns **Green / OK**:
1. Copy the environment URL (e.g. `http://expense-tracker-api-env.eba-xxxxxx.us-east-1.elasticbeanstalk.com`).
2. Test the health endpoint in your browser:
   ```text
   http://<your-eb-url>/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "database_name": "expense_tracker"
   }
   ```
3. Test interactive documentation:
   ```text
   http://<your-eb-url>/docs
   ```

---

## 🎨 Phase 3: Deploy Frontend to AWS S3 Static Hosting

### Step 1: Create S3 Bucket
1. Open the [AWS S3 Console](https://console.aws.amazon.com/s3/).
2. Click **Create bucket**.
3. Choose a globally unique name: e.g., `expense-tracker-frontend-2026` (only lowercase letters, numbers, and hyphens).
4. Select the same AWS Region as your backend.
5. Under **Object Ownership**, select **ACLs disabled (recommended)**.
6. Under **Block Public Access settings for this bucket**:
   - **Uncheck** *Block all public access*.
   - Acknowledge the warning checkbox: *"I acknowledge that the current settings might result in this bucket and the objects within it becoming public"*.
7. Click **Create bucket**.

---

### Step 2: Enable Static Website Hosting
1. Click on your newly created bucket name.
2. Go to the **Properties** tab.
3. Scroll to the bottom to **Static website hosting** and click **Edit**.
4. Select **Enable**.
5. Set Hosting type: **Host a static website**.
6. Set **Index document**: `index.html`.
7. Set **Error document**: `index.html` *(CRUCIAL for React Router client-side routes like `/dashboard`, `/expenses`, and `/analytics`)*.
8. Click **Save changes**.
9. Note the **Bucket website endpoint** at the bottom (e.g., `http://expense-tracker-frontend-2026.s3-website-us-east-1.amazonaws.com`).

---

### Step 3: Add Bucket Read Policy
1. Go to the **Permissions** tab of the bucket.
2. Scroll to **Bucket policy** and click **Edit**.
3. Paste the following policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
       }
     ]
   }
   ```
4. Click **Save changes**.

---

### Step 4: Build and Deploy the React Frontend
1. Open terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Build the production bundle with your deployed Elastic Beanstalk backend URL:
   
   **On Windows PowerShell:**
   ```powershell
   $env:VITE_API_URL="http://your-eb-environment.elasticbeanstalk.com"
   npm run build
   ```
   
   **On Linux / macOS:**
   ```bash
   VITE_API_URL="http://your-eb-environment.elasticbeanstalk.com" npm run build
   ```
   
   *This compiles optimized JavaScript, CSS, and HTML into the `frontend/dist/` directory.*

3. Upload the build files to S3:

   **Option A: Using AWS CLI**
   ```bash
   aws s3 sync dist/ s3://YOUR_BUCKET_NAME --delete
   ```

   **Option B: Using S3 Console**
   - In AWS S3 Console, open your bucket.
   - Click **Upload**.
   - Drag and drop all files and folders inside `frontend/dist/` (make sure `index.html` is at the root level of the bucket).
   - Click **Upload**.

---

## 🔒 Phase 4: Finalize CORS Configuration

To prevent unauthorized domains from calling your API while ensuring your frontend works seamlessly:

1. Go back to [AWS Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/).
2. Select your environment -> **Configuration** -> **Updates, monitoring, and logging** (or **Software**).
3. Under **Environment properties**, update `CORS_ORIGINS`:
   ```text
   http://YOUR_BUCKET_NAME.s3-website-us-east-1.amazonaws.com,http://localhost:5173
   ```
4. Click **Apply**. Elastic Beanstalk will update Nginx and restart the FastAPI processes smoothly.

---

## 🔍 Phase 5: Verification & Testing Checklist

Open your S3 website endpoint in an incognito browser window:
1. **Registration**: Register a new user (`testuser@college.edu`).
2. **Login**: Confirm token is issued and redirects to `/dashboard`.
3. **Add Expense**: Create an expense with category and payment method.
4. **Inspect Charts**: Verify Recharts donut and bar charts render with live data.
5. **Page Refresh**: Refresh on `/expenses` or `/analytics` — verify that S3 routes cleanly without returning 404.
6. **Logout**: Verify session clears and returns to `/login`.

---

## 🛠️ Common AWS Troubleshooting Tips

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **502 Bad Gateway on Elastic Beanstalk** | FastAPI failed to start or Port mismatch | Check Elastic Beanstalk **Logs** -> **Request Logs** (`/var/log/web.stdout.log`). Ensure `Procfile` uses port `5000` and `application.py` exists. |
| **CORS Error in Browser Console** | Frontend S3 URL not in `CORS_ORIGINS` | Add S3 website endpoint (without trailing slash) to `CORS_ORIGINS` in Elastic Beanstalk environment properties. |
| **MongoDB Atlas Timeout / Error** | Atlas IP whitelist does not allow AWS IP | In MongoDB Atlas, go to **Network Access** and verify `0.0.0.0/0` is active. |
| **S3 404 Not Found on Page Refresh** | S3 Error document not configured | In S3 Bucket -> **Properties** -> **Static website hosting**, set **Error document** to `index.html`. |
| **S3 403 Access Denied** | Bucket policy missing or Block Public Access enabled | Ensure "Block all public access" is OFF and the bucket policy grants `s3:GetObject` on `arn:aws:s3:::bucket/*`. |
