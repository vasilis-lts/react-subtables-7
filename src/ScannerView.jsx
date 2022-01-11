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

  const data = React.useMemo(
    () => [
      {
        productionDate: '2021-10-01T08:32:12',
        palletPosition: 'L1',
        leverancierCode: "100001",
        plantNumber: "09",
        furnaceLine: "90",
        palletNumber: "111"
      },
      {
        productionDate: '2021-10-15T09:22:12',
        palletPosition: 'R1',
        leverancierCode: "100002",
        plantNumber: "18",
        furnaceLine: "81",
        palletNumber: "222"
      },
      {
        productionDate: '2021-11-01T18:13:02',
        palletPosition: 'L1',
        leverancierCode: "100003",
        plantNumber: "27",
        furnaceLine: "72",
        palletNumber: "333"
      },
      {
        productionDate: '2021-11-15T18:32:12',
        palletPosition: 'L1',
        leverancierCode: "100004",
        plantNumber: "36",
        furnaceLine: "63",
        palletNumber: "444"
      },
      {
        productionDate: '2021-12-02T19:22:12',
        palletPosition: 'R1',
        leverancierCode: "100005",
        plantNumber: "45",
        furnaceLine: "54",
        palletNumber: "555"
      },
      {
        productionDate: '2021-12-25T22:13:02',
        palletPosition: 'L1',
        leverancierCode: "100006",
        plantNumber: "54",
        furnaceLine: "45",
        palletNumber: "666"
      },
      {
        productionDate: '2022-01-02T08:36:12',
        palletPosition: 'L1',
        leverancierCode: "100007",
        plantNumber: "63",
        furnaceLine: "36",
        palletNumber: "777"
      },
      {
        productionDate: '2022-01-14T09:24:12',
        palletPosition: 'R1',
        leverancierCode: "100008",
        plantNumber: "72",
        furnaceLine: "27",
        palletNumber: "888"
      },
      {
        productionDate: '2022-01-26T10:35:54',
        palletPosition: 'L1',
        leverancierCode: "100009",
        plantNumber: "81",
        furnaceLine: "18",
        palletNumber: "999"
      },
    ],
    [],
  )

  const columns = React.useMemo(
    () => [
      {
        Header: 'Datum',
        id: 'date',
        Cell: ({ row }) => {
          const date = row.original.productionDate.split("T")[0];
          let dateSplit = date.split("-");
          return dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0];
        }
      },
      {
        Header: 'Tijd',
        id: 'time',
        Cell: ({ row }) => row.original.productionDate.split("T")[1]
      },
      {
        Header: 'Pallet Positie',
        accessor: 'palletPosition',
      },
      {
        Header: 'Laatste pos. prod. jaar',
        id: 'lastYearDigit',
        Cell: ({ row }) => row.original.productionDate.split("-")[0].slice(-1)
      },
      {
        Header: 'Leverancier',
        accessor: 'leverancierCode',
      },
      {
        Header: 'Fabriek',
        accessor: 'plantNumber',
      },
      {
        Header: 'Oven',
        accessor: 'furnaceLine',
      },
      {
        Header: 'Batch',
        id: 'batchNumber',
        Cell: ({ row }) => {
          return getBatchNumber(row.original.productionDate)
        }
      },
      {
        Header: 'Palletnr.',
        accessor: 'palletNumber',
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

  function getData() {
    setTableData(data);
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
    const filteredData = data.filter(e => isInDateRange(e.productionDate, fromDate, toDate));
    setFilteredTableData(filteredData);
  }

  function isInDateRange(dateTime, timeStampFrom, timeStampTo) {
    const dateTimeStamp = new Date(dateTime).getTime();
    return dateTimeStamp >= timeStampFrom && dateTimeStamp <= timeStampTo;
  }

  function prepExportData(data) {
    const exportData = [];

    data.forEach(e => {
      let date = e.productionDate.split("T")[0];
      let time = e.productionDate.split("T")[1];
      date = date.split("-");
      const dateFormatted = date[2] + "/" + date[1] + "/" + date[0];

      exportData.push({
        Datum: dateFormatted,
        Tijd: time,
        Pallet_Positie: e.palletPosition,
        Laatste_Pos_Prod_Year: date[0].slice(-1),
        Leverancier: e.leverancierCode,
        Fabriek: e.plantNumber,
        Oven: e.furnaceLine,
        Batch: getBatchNumber(e.productionDate),
        PalletNr: `${e.palletNumber}`,
      })
    });

    console.log(exportData);

    setExportData(exportData)
  }

  return (
    <div id="ScannerView" style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 30, padding: 5 }}>Scanner Data</h1>

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