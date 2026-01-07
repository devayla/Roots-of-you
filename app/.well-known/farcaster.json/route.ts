import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
      "accountAssociation": {
        "header": "eyJmaWQiOjk0NzYzMSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDJiYUExRjdmYkQ0MjFjNkVjMDM1RDljQjY3MjVFNTM2YkZjQUVjZTQifQ",
        "payload": "eyJkb21haW4iOiJyb290cy1vZi15b3UudmVyY2VsLmFwcCJ9",
        "signature": "QKv/KqVu5ztsV9xVc/sGJmzEXtYuxTOA/rS3eBhdtMcG/ubRGJ6rY6eKhEekH0uY4W3josVJOgCmuHeqHui7oRw="
      }
    ,
    // TODO: Add your own account association
    frame: {
      version: "1",
      name: "Roots of You",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp"],
      primaryCategory: "social",
      buttonTitle: "Grow My Tree",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
