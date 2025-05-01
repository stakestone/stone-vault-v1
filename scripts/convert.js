// 输入的日期字符串
const dateString = "2024-05-19T23:36:31Z";

// 创建 Date 对象
const date = new Date(dateString);

// 获取时间戳（单位：毫秒）
const timestamp = date.getTime();

// 将时间戳转换成秒数（Unix 时间戳通常以秒为单位）
const timestampInSeconds = Math.floor(timestamp / 1000);

console.log('time is : ', timestampInSeconds); // 输出时间戳（以秒为单位）