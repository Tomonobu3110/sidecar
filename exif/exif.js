const fs = require('fs');
const ExifParser = require('exif-parser');

// JPEGファイルのパスを指定します。
const filePath = './image.17857125015559.jpg';

// ファイルを読み込みます。
const data = fs.readFileSync(filePath);

// ExifParserを使用して、Exif情報を解析します。
const parser = ExifParser.create(data);
const exif = parser.parse();

console.log(exif.tags);

// 撮影日時を取得します。
const date = exif.tags.DateTimeOriginal;

console.log(date); // 例: 2021:09:01 15:30:00


