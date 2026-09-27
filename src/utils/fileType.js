export const FileType = {
  IMAGE: 'image',
  PDF: 'pdf',
  TEXT: 'text',
  CODE: 'code',
  AUDIO: 'audio',
  VIDEO: 'video',
  OFFICE: 'office',
  OTHER: 'other'
};

export const extensionMap = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
  pdf: ['pdf'],
  text: ['txt', 'json', 'xml', 'csv', 'md', 'markdown'],
  code: ['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'py', 'go', 'cpp', 'c', 'php'],
  audio: ['mp3', 'ogg', 'wav', 'flac'],
  video: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
  office: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
};

export const getFileType = (fileName) => {
  if (!fileName || !fileName.includes('.')) {
    return FileType.OTHER;
  }
  const ext = fileName.split('.').pop().toLowerCase();
  for (const [type, exts] of Object.entries(extensionMap)) {
    if (exts.includes(ext)) {
      return type;
    }
  }
  return FileType.OTHER;
};

export const isNativeSupported = (fileType) => {
  return ![FileType.OFFICE, FileType.OTHER].includes(fileType);
};

export const getFileIcon = (fileType) => {
  const iconMap = {
    image: 'Image',
    pdf: 'FileText',
    text: 'FileText',
    code: 'Code',
    audio: 'Music',
    video: 'Video',
    office: 'File',
    other: 'File'
  };
  return iconMap[fileType] || 'File';
};