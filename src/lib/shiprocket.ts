import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_CHANNEL_ID = process.env.SHIPROCKET_CHANNEL_ID;
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken(): Promise<string> {
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials not configured');
  }

  try {
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    shiprocketToken = response.data.token;
    // Token typically expires in 24 hours, set expiry to 23 hours from now
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

    return shiprocketToken;
  } catch (error: any) {
    console.error('Shiprocket login error:', error?.response?.data || error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

export async function createShiprocketOrder(orderData: any): Promise<any> {
  const token = await getShiprocketToken();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shiprocket create order error:', error?.response?.data || error.message);
    throw new Error('Failed to create Shiprocket order');
  }
}

export async function generateAWB(shipmentId: string): Promise<any> {
  const token = await getShiprocketToken();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
      { shipment_id: shipmentId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shiprocket generate AWB error:', error?.response?.data || error.message);
    throw new Error('Failed to generate AWB');
  }
}