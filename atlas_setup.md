# MongoDB Atlas & Vercel Deployment Instructions

Follow these simple steps to move your database from local MongoDB to MongoDB Atlas in the cloud:

## 1. Create a MongoDB Atlas Cluster
1. Sign up/Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new free cluster (Shared tier).
3. Under **Security** -> **Database Access**, create a user (e.g., `esports_user`) and password. Remember this password!
4. Under **Network Access**, add an IP address. For deployment environments like Vercel, select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Go to **Database** -> click **Connect** on your cluster -> select **Drivers**.
6. Copy the connection string. It will look like this:
   `mongodb+srv://esports_user:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

## 2. Configure Vercel Environment Variables
Add the following key-value pairs in your project Settings under **Environment Variables** in the Vercel Dashboard:

| Key | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://esports_user:<password>@cluster0.xxxxxx.mongodb.net/esports?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI (Replace `<password>` and set DB name to `esports`) |
| `ADMIN_PASSCODE` | `your_secure_passcode` | The passcode required to access the Organizer Dashboard |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | Cloudinary name (needed for secure receipt uploads) |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | Cloudinary API Secret |

Once environment variables are saved, redeploy your project on Vercel to automatically connect to your live MongoDB Atlas cluster!
