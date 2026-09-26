// utilities/timeUtils.ts
export const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
};

export const convertToMilliseconds = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes, seconds] = timeString.split(/[hms]/).map(Number);
    return (hours || 0) * 3600000 + (minutes || 0) * 60000 + (seconds || 0) * 1000;
};

export const getTimestampFromTime = (timeString: string, dateString: string): number => {
    const combinedString = `${dateString} ${timeString}`;
    return new Date(combinedString).getTime();
};
