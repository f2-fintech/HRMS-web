import { jwtDecode, JwtPayload } from 'jwt-decode';

export const utility = () => {
  /**
   * Retrieves the role based on the role priority.
   * @param {string} rolePriority - The priority of the role.
   * @returns {string} - The name of the role.
   */
  const getRole = (rolePriority: string): string => {
    switch (rolePriority) {
      case "1":
        return "Admin";
      case "2":
        return "Manager";
      case "3":
        return "Employee";
      case "4":
        return "Channel Partner";
      default:
        return "";
    }
  };

  /**
   * Capitalizes the first letter of each word in the input value and passes the modified value
   * to the provided `handleChange` function.
   *
   * @param {Object} e - The event object triggered by the input change event.
   * @param {Function} handleChange - A callback function to handle the change of the input value.
   */
  const capitalizeInput = (e: any, handleChange: any) => {
    const { name, value } = e.target;

    // Capitalize each word in the input value
    const capitalizedValue = value
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Pass the modified event object to the handleChange function
    handleChange({ target: { name, value: capitalizedValue } });
  };

  /**
   * Gets the value associated with a key from local storage.
   * @param {string} key - The key for which to retrieve the value from local storage.
   * @returns {any | null} - The value associated with the key, or null if the key is not found.
   */
  const getLocalStorage = (key: string): any | null => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null && storedValue !== 'undefined') {
      try {
        return JSON.parse(storedValue);
      } catch (err) {
        console.error(`Error parsing ${key} from localStorage:`, err);
      }
    }
    return null;
  };

  /**
   * Removes a key-value pair from local storage.
   * @param {string} key - The key to be removed from local storage.
   * @returns {void}
   */
  const remLocalStorage = (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`Error removing ${key} from localStorage:`, err);
    }
  };

  /**
   * Sets a key-value pair in local storage.
   * @param {string} key - The key to be set in local storage.
   * @param {any} value - The value associated with the key.
   * @returns {void}
   */
  const setLocalStorage = (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error setting ${key} in localStorage:`, err);
    }
  };

  /**
   * Checks if the JWT token is expired.
   * @param {string | null} token - The JWT token to check.
   * @returns {boolean} - True if the token is expired, false otherwise.
   */
  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;

    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000; // in seconds
      return decodedToken.exp ? decodedToken.exp < currentTime : true;
    } catch (error) {
      return true;
    }
  };
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return {
    getRole,
    getLocalStorage,
    remLocalStorage,
    setLocalStorage,
    capitalizeInput,
    isTokenExpired,
    capitalizeFirstLetter,
  };
};
