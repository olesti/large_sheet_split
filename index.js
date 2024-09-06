const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const os = require("os");
var path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

var fs = require("fs");

var XLSX = require("xlsx");
const homeDir = path.join(os.homedir(), "Downloads");

/* The `readline.question` function in the provided code snippet is prompting the user to input the
path of an Excel file by displaying the message "Please Drag&Drop an excel file!". Once the user
provides the file path and hits enter, the callback function `(file_path) => { ... }` is executed. */
readline.question("Please Drag&Drop a excel file!", (file_path) => {
  console.log(`Split Process is starting!`);
  var extension = path.extname(file_path);
  let fileName = path.basename(file_path, extension);
  let folderPath = path.join(homeDir, fileName);
  // console.log(file_path,extension,fileName)
  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log("Directory created successfully!");
  });
  readFile(file_path, folderPath, fileName);
  readline.close();
});

/**
 * The function `readFile` reads an Excel file, groups the data by a specific column, and then creates
 * multiple CSV files with the grouped data.
 * @param file_path - The `file_path` parameter in the `readFile` function is the path to the Excel
 * file that you want to read and process. It should be a string that specifies the location of the
 * Excel file on your system. For example, it could be something like `"C:/Documents/data.xlsx"`
 * @param folderPath - The `folderPath` parameter in the `readFile` function represents the path to the
 * folder where the CSV files will be saved. It is the directory location where the CSV files will be
 * created by the `createCsv` function.
 * @param fileName - The `fileName` parameter in the `readFile` function is a string that represents
 * the name of the file that will be created. It will be used to generate the file name for each chunk
 * of data that is processed and saved as a CSV file.
 */
function readFile(file_path, folderPath, fileName) {
  var workbook = XLSX.readFile(file_path);
  var sheet_name_list = workbook.SheetNames;
  var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
    dateNF: "dd-mm-yyyy",
  });
  const groupedData = groupBy(xlData, "Fatura sıra");
  groupAndChunk(groupedData, 80).forEach((result, idx) =>
    createCsv(folderPath + "/" + fileName + "-" + (idx + 1) + ".csv", result)
  );
}

/**
 * The function `createFile` generates an Excel file at the specified path with data provided in the
 * `row` parameter.
 * @param file_path - The `file_path` parameter in the `createFile` function is the path where the
 * Excel file will be saved. It should include the file name and extension (e.g.,
 * "C:/Users/User/Documents/example.xlsx").
 * @param row - The `row` parameter in the `createFile` function is expected to be an array of objects
 * where each object represents a row of data to be written to the Excel file. Each key-value pair in
 * the object represents a column header and its corresponding value for that row.
 */
function createFile(file_path, row) {
  let workBook = XLSX.utils.book_new();
  const workSheet = XLSX.utils.json_to_sheet(row);
  XLSX.utils.book_append_sheet(workBook, workSheet, `sheet1`);
  XLSX.writeFile(workBook, file_path);
}
/**
 * The function `createCsv` creates a CSV file at the specified path with the provided row data.
 * @param file_path - The `file_path` parameter is the path where the CSV file will be created or
 * updated. It should be a string representing the file path including the file name and extension
 * (e.g., "data/myfile.csv").
 * @param row - The `row` parameter in the `createCsv` function is an array of objects where each
 * object represents a row of data to be written to the CSV file. Each object should have keys
 * corresponding to the column headers defined in the `header` array.
 */
async function createCsv(file_path, row) {
  const csvWriter = createCsvWriter({
    path: file_path,
    header: [
      { id: "Tarih", title: "Tarih" },
      { id: "Açıklama", title: "Açıklama" },
      { id: "İşlem Tutarı", title: "İşlem Tutarı" },
      { id: "Cari", title: "Cari" },
      { id: "Matrah", title: "Matrah" },
      { id: "Hesap Kodu", title: "Hesap Kodu" },
      { id: "Fatura sıra", title: "Fatura sıra" },
    ],
    encoding: "utf8",
  });
  await csvWriter.writeRecords(row); // returns a promise
}
/**
 * The `groupBy` function takes a list of items and groups them based on a specified key.
 * @param list - The `list` parameter is an array of objects that you want to group based on a specific
 * key.
 * @param key - The `key` parameter in the `groupBy` function is used to specify the property of the
 * objects in the `list` that will be used to group the items. The function will group the items in the
 * `list` based on the values of the specified `key` property.
 * @returns The `groupBy` function is returning an object where the items from the input list are
 * grouped based on the value of the specified key. Each property in the returned object corresponds to
 * a unique value of the key, and the value of each property is an array containing all items from the
 * input list that have that specific value for the key.
 */
function groupBy(list, key) {
  return list.reduce((grouped, item) => {
    (grouped[item[key]] ||= []).push(item);
    return grouped;
  }, {});
}
/**
 * The function `groupAndChunk` takes an object with arrays as values and splits the arrays into chunks
 * based on a maximum chunk size.
 * @param data - The `data` parameter in the `groupAndChunk` function is an object where each key holds
 * an array of items that need to be grouped and chunked based on the `maxChunkSize` provided.
 * @param maxChunkSize - The `maxChunkSize` parameter in the `groupAndChunk` function represents the
 * maximum number of elements that each chunk should contain. This parameter is used to split the input
 * data into smaller chunks or groups based on the specified size.
 * @returns The `groupAndChunk` function returns an array of arrays where the input data is grouped
 * into chunks based on the specified `maxChunkSize`.
 */
function groupAndChunk(data, maxChunkSize) {
  const result = [];
  let currentChunk = [];

  // Nesnenin her bir değerini (array) döngüye al
  Object.values(data).forEach((array) => {
    array.forEach((item, idx) => {
      if (idx === 0 && currentChunk.length + array.length > maxChunkSize) {
        result.push([...currentChunk]); // Yeni bir array oluşturarak ekle
        currentChunk = [];
      }
      currentChunk.push(item);
    });
  });

  // Son kalan öğeleri de ekle (eğer varsa)
  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result;
}
