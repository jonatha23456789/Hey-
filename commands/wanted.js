const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "wanted",
  description: "Generate a WANTED poster using user's profile picture.",
  usage: "-wanted",
  author: "Kelvin",

  async execute(senderId, args, pageAccessToken) {
    try {
      // 1. Fetch user info
      const userInfoURL =
        `https://graph.facebook.com/${senderId}?fields=name,friends.limit(0).summary(true)` +
        `&access_token=${pageAccessToken}`;

      const userRes = await axios.get(userInfoURL);
      const name = userRes.data.name;

      const friendsCount =
        userRes.data?.friends?.summary?.total_count || 0;

      // 2. Bounty calculation
      let bounty = 10000;

      if (friendsCount >= 100000) bounty = 100000000;
      else if (friendsCount >= 1000) bounty = 1000000;
      else if (friendsCount >= 100) bounty = 100000;

      // 3. Download profile picture
      const pfpURL =
        `https://graph.facebook.com/${senderId}/picture?height=512&width=512&access_token=${pageAccessToken}`;

      const pfpImg = await loadImage(pfpURL);

      // 4. Load Wanted background
      const bgURL =
        "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

      const bgImg = await loadImage(bgURL);

      // 5. Canvas (final poster)
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bgImg, 0, 0);

      // Draw user PFP in the center
      const pfpSize = 500;
      ctx.drawImage(
        pfpImg,
        canvas.width / 2 - pfpSize / 2,
        380,
        pfpSize,
        pfpSize
      );

      // Write text (Name + Bounty)
      ctx.font = "bold 70px serif";
      ctx.fillStyle = "#3a2a16";
      ctx.textAlign = "center";

      ctx.fillText(name, canvas.width / 2, 950);

      ctx.font = "bold 90px serif";
      ctx.fillText(`${bounty.toLocaleString()} PIECES`, canvas.width / 2, 1050);

      // 6. Save final image
      const finalPath = path.join(__dirname, `wanted_${senderId}.png`);
      fs.writeFileSync(finalPath, canvas.toBuffer());

      // 7. Upload to Facebook (ONLY 1 FILE)
      const formData = {
        message: JSON.stringify({
          attachment: { type: "image", payload: { is_reusable: true } }
        }),
        filedata: fs.createReadStream(finalPath)
      };

      const upload = await axios({
        method: "post",
        url: `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        headers: { "Content-Type": "multipart/form-data" },
        data: formData
      });

      const attachmentId = upload.data.attachment_id;

      // 8. Send final message
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: { attachment_id: attachmentId }
        }
      }, pageAccessToken);

      fs.unlinkSync(finalPath);

    } catch (err) {
      console.error("WANTED ERROR:", err);
      return sendMessage(senderId, {
        text: "❌ Failed to generate WANTED poster."
      }, pageAccessToken);
    }
  }
};
