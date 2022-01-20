import { Button } from "@chakra-ui/react";
import React, { useEffect, useState } from "react"
import DateTimePicker from "react-datetime-picker";
import DynamicTable from "./DynamicTable"
import { CSVLink } from "react-csv";

export default function ScannerView() {
  const [valueFrom, onChangeFrom] = useState(null);
  const [valueTo, onChangeTo] = useState(null);
  const [TableData, setTableData] = useState([]);
  const [FilteredTableData, setFilteredTableData] = useState(null);
  const [ExportData, setExportData] = useState([]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Datum',
        id: 'date',
        Cell: ({ row }) => {
          const date = row.original.ScanDateTime.split("T")[0];
          let dateSplit = date.split("-");
          return dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0];
        }
      },
      {
        Header: 'Tijd',
        id: 'time',
        Cell: ({ row }) => row.original.ScanDateTime.split("T")[1].split(".")[0]
      },
      // {
      //   Header: 'Pallet Positie',
      //   accessor: 'palletPosition',
      // },
      {
        Header: 'Laatste pos. prod. jaar',
        id: 'lastYearDigit',
        Cell: ({ row }) => row.original.ScanDateTime.split("-")[0].slice(-1)
      },
      {
        Header: 'Leverancier',
        accessor: 'SupplierCode',
      },
      {
        Header: 'Fabriek',
        accessor: 'Factory',
      },
      {
        Header: 'Oven',
        accessor: 'FurnaceLine',
      },
      {
        Header: 'Batch',
        id: 'batchNumber',
        Cell: ({ row }) => {
          return getBatchNumber(row.original.ScanDateTime)
        }
      },
      {
        Header: 'Palletnr.',
        accessor: 'PalletNr',
      },
    ],
    [],
  )

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (TableData.length || FilteredTableData?.length) {
      const data = FilteredTableData ? [...FilteredTableData] : [...TableData];
      prepExportData(data);
    }
    // eslint-disable-next-line
  }, [TableData, FilteredTableData]);

  useEffect(() => {
    if (valueFrom && valueTo) {
      const timeStampFrom = valueFrom.getTime();
      const timeStampTo = valueTo.getTime();
      if (timeStampTo < timeStampFrom) {
        alert('Vanaf datum moet vroeger zijn dan Tot datum')
      } else {
        filterData(timeStampFrom, timeStampTo);
      }
    } else {
      setFilteredTableData(null);
    }
    // eslint-disable-next-line
  }, [valueFrom, valueTo]);

  async function getData() {

    let res;
    await fetch(`https://vfqbp0x9t2.execute-api.eu-central-1.amazonaws.com/rfid-demo-lambda`
      , {
        headers: {
          'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
          'Access-Control-Allow-Credentials': true,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
      .then(function (response) { return response.json(); })
      .then(function (myJson) { res = myJson; })
      .catch(err => { res = err; })

    setTableData(res);
  }

  function getBatchNumber(date) {
    const now = new Date(date);
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return day;
  }

  function filterData(fromDate, toDate) {
    const filteredData = TableData.filter(e => isInDateRange(e.ScanDateTime, fromDate, toDate));
    setFilteredTableData(filteredData);
  }

  function isInDateRange(dateTime, timeStampFrom, timeStampTo) {
    const dateTimeStamp = new Date(dateTime).getTime();
    return dateTimeStamp >= timeStampFrom && dateTimeStamp <= timeStampTo;
  }

  function prepExportData(data) {
    const exportData = [];

    data.forEach(e => {
      let date = e.ScanDateTime.split("T")[0];
      let time = e.ScanDateTime.split("T")[1].split(".")[0];
      date = date.split("-");
      const dateFormatted = date[2] + "/" + date[1] + "/" + date[0];

      exportData.push({
        Datum: dateFormatted,
        Tijd: time,
        Laatste_Pos_Prod_Year: date[0].slice(-1),
        Leverancier: e.SupplierCode,
        Fabriek: e.Factory,
        Oven: e.FurnaceLine,
        Batch: getBatchNumber(e.ScanDateTime),
        PalletNr: `${e.PalletNr}`,
      })
    });

    console.log(exportData);

    setExportData(exportData)
  }

  return (
    <div id="ScannerView" style={{ maxWidth: 1200, paddingLeft: "50px", paddingTop: 50 }}>
      <h1 style={{ fontSize: 30, padding: 5, fontWeight: 700 }}>Scanner Data</h1>

      <div className="table-actions">
        <div className="actions-left">
          <label htmlFor="from">Van: </label>
          <DateTimePicker
            onChange={onChangeFrom}
            value={valueFrom}
          />
          <label htmlFor="from">Tot: </label>
          <DateTimePicker
            onChange={onChangeTo}
            value={valueTo}
          />
        </div>
        <div className="actions-left">
          <Button colorScheme={'blue'}>
            <CSVLink
              filename="RFID_Scans"
              data={ExportData}
            >Export CSV
            </CSVLink>
          </Button>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 20 }}>
        <DynamicTable
          className="RFIDScans"
          columns={columns}
          data={FilteredTableData ? FilteredTableData : TableData}
          refresh={() => getData()}
          loading={false}
          globalFilter={true}
        />
      </div>

    </div>
  )
}