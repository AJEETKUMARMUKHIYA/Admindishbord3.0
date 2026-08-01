import AxiosClient from '../AxiosClient';

export const checkAndCreateUser = async (mobileNumber, userData = {}) => {
  try {
    const response = await AxiosClient.get(`/User/GetUserByPhone?phone=${mobileNumber}`).catch(() => null);
    if (response && response.data && (response.data.userID || response.data.id)) {
      return {
        userID: response.data.userID || response.data.id,
        addressID: response.data.addressID || response.data.defaultAddressID || "1",
        ...response.data
      };
    }

    const createRes = await AxiosClient.post('/User/CreateUser', {
      phone: mobileNumber,
      name: userData.name || 'Customer',
      email: userData.email || `${mobileNumber}@packyatra.com`
    }).catch(() => null);

    if (createRes && createRes.data && (createRes.data.userID || createRes.data.id)) {
      return {
        userID: createRes.data.userID || createRes.data.id,
        addressID: createRes.data.addressID || "1",
        ...createRes.data
      };
    }

    return {
      userID: `USR-${mobileNumber.slice(-4)}`,
      addressID: "1",
      phone: mobileNumber,
      name: userData.name || 'Customer',
      email: userData.email || `${mobileNumber}@packyatra.com`
    };
  } catch (err) {
    console.warn("checkAndCreateUser error:", err);
    return {
      userID: `USR-${mobileNumber.slice(-4)}`,
      addressID: "1",
      phone: mobileNumber,
      name: userData.name || 'Customer',
      email: userData.email || `${mobileNumber}@packyatra.com`
    };
  }
};
