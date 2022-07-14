const excel = require("exceljs");
module.exports = async (res, config) => {
  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet(config.productSheetName, {views:[{state: 'frozen', xSplit: 0, ySplit:1}]});

  worksheet.columns = config.productExcelHeaders;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "landDetails.xlsx"
  );

  return await workbook.xlsx.write(res);
};