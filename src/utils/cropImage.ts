export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: any
): Promise<Blob> => {
  return new Promise(async resolve => {
    const image = new Image()

    image.src = imageSrc

    await new Promise(res => {
      image.onload = res
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx?.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    canvas.toBlob(blob => {
      resolve(blob!)
    }, 'image/jpeg')
  })
}
