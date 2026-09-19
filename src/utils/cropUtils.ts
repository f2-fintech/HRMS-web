export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation: number = 0
): Promise<string> => {
    const createImage = (url: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // Handle CORS for external images
            image.onload = () => resolve(image);
            image.onerror = (error) => reject(error);
            image.src = url;
        });

    const getRadianAngle = (degreeValue: number) => {
        return (degreeValue * Math.PI) / 180;
    };

    const rotateSize = (width: number, height: number, angle: number) => {
        const radian = getRadianAngle(angle);
        return {
            width: Math.abs(Math.cos(radian) * width) + Math.abs(Math.sin(radian) * height),
            height: Math.abs(Math.sin(radian) * width) + Math.abs(Math.cos(radian) * height),
        };
    };

    const image_1 = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not create canvas context');
    }
    const { width: width_2, height: height_1 } = rotateSize(image_1.width, image_1.height, rotation);
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(image_1, pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
    );
    return await new Promise<string>((resolve_1) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve_1(URL.createObjectURL(blob));
            }
        }, 'image/jpeg');
    });
};
