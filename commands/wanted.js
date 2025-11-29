const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "wanted",
  description: "Generate a wanted poster with FB profile, name and bounty.",
  usage: "-wanted",
  author: "Kelvin",

  async execute(senderId, args, pageAccessToken) {
    try {
      // 1. Get user info
      const userInfoURL = `https://graph.facebook.com/${senderId}?fields=name,friends.limit(0).summary(true)&access_token=${pageAccessToken}`;
      const userInfo = await axios.get(userInfoURL);
      const name = userInfo.data.name || "Unknown User";

      // 2. Get follower/ friend count
      const totalFriends = userInfo.data?.friends?.summary?.total_count || 0;

      // 3. Convert friends into bounty
      let bounty = 0;

      if (totalFriends >= 100000) {
        bounty = 100000000; // 100M
      } else if (totalFriends >= 1000) {
        bounty = 1000000; // 1M
      } else if (totalFriends >= 100) {
        bounty = 100000; // 100K
      } else {
        bounty = 10000; // default minimum
      }

      // 4. Get profile picture
      const pfpUrl = `https://graph.facebook.com/${senderId}/picture?height=512&width=512&access_token=${pageAccessToken}`;
      const pfpPath = path.join(__dirname, "pfp.jpg");

      const pfpStream = await axios.get(pfpUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(pfpPath, Buffer.from(pfpStream.data));

      // 5. Wanted background (your image)
      const bgUrl = "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

      const bgPath = path.join(__dirname, "wanted_bg.jpg");
      const bgStream = await axios.get(bgUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, Buffer.from(bgStream.data));

      // 6. Upload background as FB reusable image
      const uploadBg = await axios({
        method: "post",
        url: `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        headers: { "Content-Type": "multipart/form-data" },
        data: {
          message: JSON.stringify({
            attachment: { type: "image", payload: { is_reusable: true } }
          }),
          filedata: fs.createReadStream(bgPath)
        }
      });

      const bgAttachmentId = uploadBg.data.attachment_id;

      // 7. Upload profile picture as reusable image too
      const uploadPfp = await axios({
        method: "post",
        url: `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        headers: { "Content-Type": "multipart/form-data" },
        data: {
          message: JSON.stringify({
            attachment: { type: "image", payload: { is_reusable: true } }
          }),
          filedata: fs.createReadStream(pfpPath)
        }
      });

      const pfpAttachmentId = uploadPfp.data.attachment_id;

      // 8. Send WANTED poster message
      await sendMessage(
        senderId,
        {
          text: `🔫 *WANTED POSTER*\n\n👤 Name: ${name}\n👥 Friends/Followers: ${totalFriends}\n💰 Bounty: ${bounty.toLocaleString()} pièces\n\n📌 Your wanted poster is below!`
        },
        pageAccessToken
      );

      // 9. Send images (background + PFP separately)
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              attachment_id: bgAttachmentId
            }
          }
        },
        pageAccessToken
      );

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              attachment_id: pfpAttachmentId
            }
          }
        },
        pageAccessToken
      );

      // Cleanup temp files
      fs.unlinkSync(pfpPath);
      fs.unlinkSync(bgPath);

    } catch (err) {
      console.log("Wanted Error:", err.message);
      return sendMessage(senderId, { text: "❌ Failed to generate wanted poster." }, pageAccessToken);
    }
  }
};
