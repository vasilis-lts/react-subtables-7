import { Button } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react"
import DateTimePicker from "react-datetime-picker";
import DynamicTable from "./DynamicTable"
import { Spinner } from '@chakra-ui/react'
import { CSVLink } from "react-csv";
import { ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons'

export default function ScannerView() {
  const [valueFrom, onChangeFrom] = useState(null);
  const [valueTo, onChangeTo] = useState(null);
  const [TableData, setTableData] = useState([]);
  const [FilteredTableData, setFilteredTableData] = useState(null);
  const [ExportData, setExportData] = useState([]);
  const [ShowLoading, setShowLoading] = useState(false);
  const [ShowErrorMsg, setShowErrorMsg] = useState(false);
  const [AllData, setAllData] = useState(null);
  const csvLink = useRef();

  const columns = React.useMemo(
    () => [
      {
        // Make an expander cell
        Header: () => null, // No header
        id: 'expander', // It needs an ID
        Cell: ({ row }) => (
          // Use Cell to render an expander for each row.
          // We can use the getToggleRowExpandedProps prop-getter
          // to build the expander.
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? <ChevronDownIcon w={8} h={8} color="green.500" /> : <ChevronRightIcon w={8} h={8} />}
          </span>
        ),
        // We can override the cell renderer with a SubCell to be used with an expanded row
        SubCell: () => null // No expander on an expanded row
      },
      {
        Header: 'Session Id',
        accessor: 'SessionId',
      },
      {
        Header: 'Total Scans',
        accessor: 'TotalScans',
      },
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
        accessor: 'ProductionYear',
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
        accessor: 'Batch',
        // Cell: ({ row }) => {
        //   return getBatchNumber(row.original.ScanDateTime)
        // }
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
      // prepExportData();
    }
    // eslint-disable-next-line
  }, [TableData, FilteredTableData]);

  useEffect(() => {
    if (valueFrom && valueTo) {
      const timeStampFrom = valueFrom.getTime();
      const timeStampTo = valueTo.getTime();
      if (timeStampTo < timeStampFrom) {
        setShowErrorMsg(true);
      } else {
        setShowErrorMsg(false);
        filterData(timeStampFrom, timeStampTo);
      }
    } else {
      setFilteredTableData(null);
    }
    // eslint-disable-next-line
  }, [valueFrom, valueTo]);

  async function getData() {

    setShowLoading(true);
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

    setAllData(res);

    // group 1
    groupBySessionId(res);
  }

  function groupBySessionId(res) {
    // setTableData(res);
    const parentTable = [];

    res.forEach(entry => {
      if (parentTable.find(pe => pe.SessionId === entry.SessionId)) {
        // increase total scans and update latest DateTime
        const indexToUpdate = parentTable.findIndex(pe => pe.SessionId === entry.SessionId)
        parentTable[indexToUpdate].TotalScans = parentTable[indexToUpdate].TotalScans + 1;
        parentTable[indexToUpdate].ScanDateTime = entry.ScanDateTime;
        // const subRows = [...parentTable[indexToUpdate].subRows];
        // subRows.push(entry);
        // parentTable[indexToUpdate].subRows = subRows;
      } else {
        // just push :)
        entry.TotalScans = 1;
        // entry.subRows = [entry];
        parentTable.push(entry);
      }
    });

    console.log(parentTable);
    prepExportData(res);
    setTableData(parentTable);
    setShowLoading(false);
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
    let filteredData;
    let _data = [];

    if (valueFrom && valueTo) {
      const timeStampFrom = valueFrom.getTime();
      const timeStampTo = valueTo.getTime();
      filteredData = data.filter(e => isInDateRange(e.ScanDateTime, timeStampFrom, timeStampTo));
    }

    _data = filteredData ? [...filteredData] : [...data];

    _data.forEach(e => {
      let date = e.ScanDateTime.split("T")[0];
      let time = e.ScanDateTime.split("T")[1].split(".")[0];
      date = date.split("-");
      const dateFormatted = date[2] + "/" + date[1] + "/" + date[0];

      exportData.push({
        Datum: dateFormatted,
        Tijd: time,
        Laatste_Pos_Prod_Year: e.ProductionYear,
        Leverancier: e.SupplierCode,
        Fabriek: e.Factory,
        Oven: e.FurnaceLine,
        Batch: e.Batch,
        PalletNr: `${e.PalletNr}`,
      })
    });

    setExportData(exportData)
  }

  return (
    <div id="ScannerView" style={{ paddingLeft: "50px", paddingTop: 50 }}>
      <div className="title" style={{ display: "flex", alignItems: "center" }}>

        <h1 style={{ fontSize: 30, padding: 5, fontWeight: 700 }}>Scanner Data</h1>

        {ShowLoading ?
          <div className="loading-spinner">
            <Spinner /> Please Wait...
          </div>
          : null}
      </div>

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
          <Button onClick={() => {
            csvLink.current.link.click();
          }} colorScheme={'blue'}>Export CSV</Button>
          <CSVLink
            filename="RFID_Scans"
            data={ExportData}
            ref={csvLink}
            target='_blank'
            className="hidden"
          />
        </div>
      </div>
      {ShowErrorMsg ?
        <div className="error-message" style={{ color: 'red' }}>Vanaf datum moet vroeger zijn dan Tot datum</div>
        : null}

      <div className="table-container" style={{ marginTop: 20 }}>
        <DynamicTable
          className="RFIDScans"
          columns={columns}
          data={FilteredTableData ? FilteredTableData : TableData}
          refresh={() => getData()}
          loading={false}
          globalFilter={true}
          allData={AllData}
        />
      </div>
      {!TableData.length && !ShowLoading ? <div>No data</div> : null}

    </div>
  )
}