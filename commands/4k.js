const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

const getImageUrl = async (event, token) => {
  const mid = event?.message?.reply_to?.mid || event?.message?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v22.0/${mid}/attachments`,
      {
        params: { access_token: token }
      }
    );

    return data?.data?.[0]?.image_data?.url || data?.data?.[0]?.file_url || null;
  } catch (err) {
    console.error("Image URL fetch error:", err?.response?.data || err.message);
    return null;
  }
};

module.exports = {
  name: '4k',
  description: 'Enhance image using AZADX 4K API',
  usage: '-4k (reply to image)',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event) {

    const imageUrl = await getImageUrl(event, pageAccessToken);

    if (!imageUrl) {
      return sendMessage(
        senderId,
        { text: '❎ | Please reply to an image.' },
        pageAccessToken
      );
    }

    try {

      // 💬 loading
      await sendMessage(
        senderId,
        { text: '🔄 Enhancing image to 4K, please wait...' },
        pageAccessToken
      );

      // 🔥 NEW API
      const apiUrl =
        `https://azadx69x-all-apis-top.vercel.app/api/4k?imgUrl=${encodeURIComponent(imageUrl)}`;

      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      const resultUrl = data?.result || data?.image || data?.url;

      if (!resultUrl) {
        return sendMessage(
          senderId,
          { text: '❎ | 4K API failed to process image.' },
          pageAccessToken
        );
      }

      // 📥 download result
      const resultImg = await axios.get(resultUrl, {
        responseType: 'arraybuffer'
      });

      const tmpOutput = path.join(__dirname, `tmp_4k_${Date.now()}.jpg`);
      fs.writeFileSync(tmpOutput, resultImg.data);

      // 📤 upload to Facebook
      const fbForm = new FormData();

      fbForm.append(
        'message',
        JSON.stringify({
          attachment: {
            type: 'image',
            payload: { is_reusable: true }
          }
        })
      );

      fbForm.append('filedata', fs.createReadStream(tmpOutput));

      const uploadRes = await axios.post(
        `https://graph.facebook.com/v22.0/me/message_attachments?access_token=${pageAccessToken}`,
        fbForm,
        { headers: fbForm.getHeaders() }
      );

      const attachmentId = uploadRes.data.attachment_id;

      await axios.post(
        `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'image',
              payload: {
                attachment_id: attachmentId
              }
            }
          }
        }
      );

      fs.unlinkSync(tmpOutput);

    } catch (err) {
      console.error('4K CMD Error:', err.response?.data || err.message);

      await sendMessage(
        senderId,
        { text: '❎ | 4K enhancement failed.' },
        pageAccessToken
      );
    }
  }
};
