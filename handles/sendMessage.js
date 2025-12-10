const axios = require("axios");
const FormData = require("form-data");

async function sendMessage(senderId, data, token) {
    const url = `https://graph.facebook.com/v22.0/me/messages`;
    const uploadUrl = `https://graph.facebook.com/v22.0/me/message_attachments`;
    const params = { access_token: token };

    try {
        // ------- TEXT ONLY -------
        if (data.text) {
            await axios.post(url, {
                recipient: { id: senderId },
                message: { text: data.text }
            }, { params });

            return;
        }

        // ------- FILE BUFFER (VIDEO / IMAGE / AUDIO / FILE) -------
        if (data.attachment && Buffer.isBuffer(data.attachment)) {

            const form = new FormData();
            form.append("message", JSON.stringify({
                attachment: {
                    type: data.type,
                    payload: { is_reusable: true }
                }
            }));
            form.append("filedata", data.attachment, {
                filename: "file." + (data.ext || "mp4")
            });

            const uploadRes = await axios.post(uploadUrl, form, {
                params,
                headers: form.getHeaders()
            });

            const attachmentId = uploadRes.data.attachment_id;

            // Now send the message with the ID
            await axios.post(url, {
                recipient: { id: senderId },
                message: {
                    attachment: {
                        type: data.type,
                        payload: {
                            attachment_id: attachmentId
                        }
                    }
                }
            }, { params });

            return;
        }

        // ------- URL ATTACHMENT -------
        if (data.url) {
            await axios.post(url, {
                recipient: { id: senderId },
                message: {
                    attachment: {
                        type: data.type,
                        payload: {
                            url: data.url,
                            is_reusable: true
                        }
                    }
                }
            }, { params });

            return;
        }

    } catch (err) {
        console.log("SEND ERROR:", err.response?.data || err.message);
    }
}

module.exports = { sendMessage };
