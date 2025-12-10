const axios = require('axios');
const FormData = require("form-data");
const path = require('path');

const axiosPost = (url, data, params = {}) =>
  axios.post(url, data, { params }).then(res => res.data);

const sendMessage = async (senderId, content, pageAccessToken) => {
  if (!content) return;

  const url = `https://graph.facebook.com/v22.0/me/messages`;
  const uploadUrl = `https://graph.facebook.com/v22.0/me/message_attachments`;
  const params = { access_token: pageAccessToken };

  try {
    // Typing...
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_on" }, params);

    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    // ---- CASE 1 : TEXT ----
    if (content.text) {
      messagePayload.message.text = content.text;
    }

    // ---- CASE 2 : URL ATTACHMENT ----
    if (content.attachment && content.attachment.url) {
      messagePayload.message.attachment = {
        type: content.type,
        payload: {
          url: content.attachment.url,
          is_reusable: true
        }
      };

      await axiosPost(url, messagePayload, params);
      return;
    }

    // ---- CASE 3 : FILE BUFFER (video/image/audio/file) ----
    if (content.attachment && Buffer.isBuffer(content.attachment)) {

      const form = new FormData();
      form.append("message", JSON.stringify({
        attachment: {
          type: content.type,
          payload: { is_reusable: true }
        }
      }));
      form.append("filedata", content.attachment, "upload." + (content.ext || "mp4"));

      const uploadRes = await axios.post(uploadUrl, form, {
        params,
        headers: form.getHeaders()
      });

      // Attach ID
      messagePayload.message.attachment = {
        type: content.type,
        payload: {
          attachment_id: uploadRes.attachment_id
        }
      };
    }

    // SEND
    await axiosPost(url, messagePayload, params);

    // Typing off
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_off" }, params);

  } catch (e) {
    const errorMessage = e.response?.data?.error?.message || e.message;
    console.error(`Error in ${path.basename(__filename)}: ${errorMessage}`);
  }
};

module.exports = { sendMessage };
