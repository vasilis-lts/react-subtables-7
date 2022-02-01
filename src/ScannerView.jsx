import { Button } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react"
// import DateTimePicker from "react-datetime-picker";
import { Spinner } from '@chakra-ui/react'
import { CSVLink } from "react-csv";
import { ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { useTable, usePagination, useSortBy, useGlobalFilter, useExpanded } from 'react-table';
import styled from 'styled-components';

export default function ScannerView() {
  const [valueFrom,
    // onChangeFrom
  ] = useState(null);
  const [valueTo,
    //  onChangeTo
  ] = useState(null);
  const [TableData, setTableData] = useState([]);
  const [FilteredTableData, setFilteredTableData] = useState(null);
  const [ExportData, setExportData] = useState([]);
  const [ShowLoading, setShowLoading] = useState(false);
  const [ShowErrorMsg, setShowErrorMsg] = useState(false);
  const [AllData, setAllData] = useState(null);
  const csvLink = useRef();

  const Styles = styled.div`
  /* This is required to make the table full-width */
  display: block;
  max-width: 100%;

  /* This will make the table scrollable when it gets too small */
  .tableWrap {
    display: block;
    max-width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    border-bottom: 1px solid #777;
  }

  table {
    /* Make sure the inner table is always as wide as needed */
    width: 100%;
    border-spacing: 0;

    tr {
      :first-child {
        border-top: 1px solid #777;
      }
      :last-child {
        td {
          // border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0 0.1rem;
      border-bottom: 1px solid #777;
      border-right: 1px solid #777;
      text-align:center;
      font-size:14px;

      /* The secret sauce */
      /* Each cell should grow equally */
      width: 1%;
      /* But "collapsed" cells should be as small as possible */
      &.collapse {
        width: 0.0000000001%;
      }

      :first-child {
        border-left: 1px solid #777;
      }
      :last-child {
        // border-right: 0;
      }
    }
  }

  // .pagination {
  //   padding: 0.5rem;
  // }
`

  const columns = React.useMemo(
    () => [
      // {
      //   // Make an expander cell
      //   Header: () => null, // No header
      //   id: 'expander', // It needs an ID
      //   Cell: ({ row }) => (
      //     // Use Cell to render an expander for each row.
      //     // We can use the getToggleRowExpandedProps prop-getter
      //     // to build the expander.
      //     <span {...row.getToggleRowExpandedProps()}>
      //       {row.isExpanded ? <ChevronDownIcon w={8} h={8} color="green.500" /> : <ChevronRightIcon w={8} h={8} />}
      //     </span>
      //   ),
      //   width: 50,
      //   // We can override the cell renderer with a SubCell to be used with an expanded row
      //   SubCell: () => null // No expander on an expanded row
      // },
      {
        Header: 'Session Id',
        accessor: 'SessionId',
        width: 330,
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.SessionId}</div>
        }
      },

      {
        Header: 'Datum',
        id: 'date',
        Cell: ({ row }) => {
          const date = row.original.ScanDateTime.split("T")[0];
          let dateSplit = date.split("-");
          return <div className="table-cell">{dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0]}</div>
        }
      },
      {
        Header: 'Tijd',
        id: 'time',
        Cell: ({ row }) => {
          return <div className="table-cell">
            {row.original.ScanDateTime.split("T")[1].split(".")[0]}
          </div>
        }
      },
      // {
      //   Header: 'Pallet Positie',
      //   accessor: 'palletPosition',
      // },
      {
        Header: 'Laatste pos. prod. jaar',
        accessor: 'ProductionYear',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.ProductionYear}</div>
        }
      },
      {
        Header: 'Leverancier',
        accessor: 'SupplierCode',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.SupplierCode}</div>
        }
      },
      {
        Header: 'Fabriek',
        accessor: 'Factory',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.Factory}</div>
        }
      },
      {
        Header: 'Oven',
        accessor: 'FurnaceLine',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.FurnaceLine}</div>
        }
      },
      {
        Header: 'Batch',
        accessor: 'Batch',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.Batch}</div>
        }
      },
      {
        Header: 'Palletnr.',
        accessor: 'PalletNr',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.PalletNr}</div>
        }
      },
      {
        Header: 'Total Scans',
        accessor: 'TotalScans',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.TotalScans}</div>
        }
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


    // sort date (newest first)
    const sorted = res.sort(function (a, b) {
      return new Date(b.ScanDateTime) - new Date(a.ScanDateTime);
    });


    // get lastSessionIdOnly
    const lastOnly = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      if (!lastOnly.length) { lastOnly.push(entry) }

      if (lastOnly.find(e => e.SessionId === entry.SessionId)) {
        lastOnly.push(entry)
      }
    }

    // group 1
    groupBySessionId(lastOnly);
  }

  function groupBySessionId(res) {
    // setTableData(res);
    const parentTable = [];
    const sessionIds = [];

    res.forEach(entry => {
      if (parentTable.find(pe =>
        pe.SessionId === entry.SessionId &&
        pe.PalletNr === entry.PalletNr &&
        pe.Batch === entry.Batch &&
        pe.CheckDigit === entry.CheckDigit &&
        pe.Factory === entry.Factory &&
        pe.FurnaceLine === entry.FurnaceLine &&
        pe.ProductionYear === entry.ProductionYear &&
        pe.SupplierCode === entry.SupplierCode
      )) {
        // increase total scans and update latest DateTime
        const indexToUpdate = parentTable.findIndex(pe =>
          pe.SessionId === entry.SessionId &&
          pe.PalletNr === entry.PalletNr &&
          pe.Batch === entry.Batch &&
          pe.CheckDigit === entry.CheckDigit &&
          pe.Factory === entry.Factory &&
          pe.FurnaceLine === entry.FurnaceLine &&
          pe.ProductionYear === entry.ProductionYear &&
          pe.SupplierCode === entry.SupplierCode
        )
        parentTable[indexToUpdate].TotalScans = parentTable[indexToUpdate].TotalScans + 1;
        parentTable[indexToUpdate].ScanDateTime = entry.ScanDateTime;
        // const subRows = [...parentTable[indexToUpdate].subRows];
        // subRows.push(entry);
        // parentTable[indexToUpdate].subRows = subRows;
      } else {
        // just push :)
        entry.TotalScans = 1;
        sessionIds.push(entry.SessionId);
        // entry.subRows = [entry];
        parentTable.push(entry);
      }
    });

    // sort by pallet number
    let sorted = parentTable.sort(
      function (a, b) {
        return a.PalletNr - b.PalletNr;
      }
    )

    prepExportData(res);
    setTableData(sorted);
    setAllData(res);
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
        AntennaId: e.AntennaId,
        Laatste_Pos_Prod_Year: e.ProductionYear,
        Leverancier: e.SupplierCode,
        Fabriek: e.Factory,
        Oven: e.FurnaceLine,
        Batch: e.Batch,
        PalletNr: `${e.PalletNr}`,
        // TotalScans: e.TotalScans
      })
    });

    setExportData(exportData)
  }

  return (
    <div id="ScannerView" style={{ paddingLeft: "20px", paddingTop: 50, maxWidth: 1100 }}>
      <div className="title" style={{ display: "flex", alignItems: "center" }}>

        <h1 style={{ fontSize: 30, padding: 5, fontWeight: 700 }}>Scanner Data</h1>

        {ShowLoading ?
          <div className="loading-spinner">
            <Spinner /> Please Wait...
          </div>
          : null}
      </div>

      <div className="table-actions">
        {/* <div className="actions-left">
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
        </div> */}
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

        <Styles>
          <Table
            columns={columns}
            data={FilteredTableData ? FilteredTableData : TableData}
            allData={AllData}
          />
        </Styles>

      </div>
      {!TableData.length && !ShowLoading ? <div>No data</div> : null}

    </div>
  )
}


function Table({ columns, data, children, updateSubTableData, allData, hideExpander, allRows }) {
  const [open, setOpen] = React.useState(false);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,

    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    // setGlobalFilter,

    // Get the state from the instance
    state: { pageIndex, pageSize },

  } = useTable({
    columns,
    data,
    initialState: {
      pageIndex: 0,
      pageSize: allRows ? 1000000 : 10
    }, // Pass our hoisted table state
  },
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination,
  )

  const columnsSub = React.useMemo(
    () => [
      {
        Header: 'Session Id',
        accessor: 'SessionId',
        width: 330,
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.SessionId}</div>
        }
      },
      {
        Header: 'Antenna Id',
        accessor: 'AntennaId',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.AntennaId}</div>
        }
      },
      {
        Header: 'Datum',
        id: 'date',
        Cell: ({ row }) => {
          const date = row.original.ScanDateTime.split("T")[0];
          let dateSplit = date.split("-");
          return <div className="table-cell">{dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0]}</div>
        }
      },
      {
        Header: 'Tijd',
        id: 'time',
        Cell: ({ row }) => <div className="table-cell">{row.original.ScanDateTime.split("T")[1].split(".")[0]}</div>
      },
      {
        Header: 'Laatste pos. prod. jaar',
        accessor: 'ProductionYear',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.ProductionYear}</div>
        }
      },
      {
        Header: 'Leverancier',
        accessor: 'SupplierCode',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.SupplierCode}</div>
        }
      },
      {
        Header: 'Fabriek',
        accessor: 'Factory',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.Factory}</div>
        }
      },
      {
        Header: 'Oven',
        accessor: 'FurnaceLine',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.FurnaceLine}</div>
        }
      },
      {
        Header: 'Batch',
        accessor: 'Batch',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.Batch}</div>
        }
      },
      {
        Header: 'Palletnr.',
        accessor: 'PalletNr',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.PalletNr}</div>
        }
      },


      {
        Header: 'Number of Scans',
        accessor: 'Scans',
        Cell: ({ row }) => {
          return <div className="table-cell">{row.original.Scans}</div>
        }
      },

    ],
    [],
  )

  const toggleRowOpen = (id, row) => {
    if (open === id) {
      setOpen(false);
      // setActiveRow(null)
    } else {
      setOpen(id);
      // setActiveRow(row)
    }
  };

  // Render the UI for your table
  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <React.Fragment key={headerGroup.headers.length + "_hfrag"}>
              <tr {...headerGroup.getHeaderGroupProps()}>
                {!hideExpander && <th></th>}
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps({
                    style: { minWidth: column.width ? column.width : 150 }
                  })}>{column.render("Header")}</th>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={i + "_frag"}>
                <tr {...row.getRowProps()}>
                  {!hideExpander &&
                    <td>
                      <span id={row.id} onClick={() => { toggleRowOpen(row.id, row); }}>
                        {open === row.id ? <ChevronDownIcon w={8} h={8} color="green.500" /> : <ChevronRightIcon w={8} h={8} />}
                      </span>
                    </td>
                  }
                  {row.cells.map((cell, index) => {
                    return (
                      // <div key={index} style={{ height: 20, overflow: "hidden" }}>

                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                      // </div>
                    );
                  })}
                </tr>
                {open === row.id && (
                  <tr colSpan={7}>
                    <td colSpan={12}>
                      {/* {children} */}
                      <div className="table-children" style={{ padding: '0', margin: '10px 5px', border: '1px solid #ccc' }}>
                        <SubTable row={row} columns={columnsSub} allData={allData} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              console.log(page)
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}


function SubTable({ row, columns, allData }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let filtered = allData.filter(entry =>
      entry.SessionId === row.original.SessionId &&
      entry.PalletNr === row.original.PalletNr &&
      entry.Batch === row.original.Batch &&
      entry.CheckDigit === row.original.CheckDigit &&
      entry.Factory === row.original.Factory &&
      entry.FurnaceLine === row.original.FurnaceLine &&
      entry.ProductionYear === row.original.ProductionYear &&
      entry.SupplierCode === row.original.SupplierCode
    );

    console.log(filtered)

    // group by antennaId
    const groupedPerAntId = [];
    filtered.forEach(entry => {
      if (groupedPerAntId.find(eg => eg.AntennaId === entry.AntennaId)) {
        const indexToUpdate = groupedPerAntId.findIndex(eg => eg.AntennaId === entry.AntennaId)
        groupedPerAntId[indexToUpdate].Scans = groupedPerAntId[indexToUpdate].Scans + 1;
      } else {
        entry.Scans = 1;
        groupedPerAntId.push(entry);
      }
    });

    // double sort example
    // let sorted = filtered.sort(
    //   function (a, b) {
    //     if (a.PalletNr === b.PalletNr) {
    //       return a.AntennaId - b.AntennaId;
    //     }
    //     return a.PalletNr > b.PalletNr ? 1 : -1;
    //   });
    // console.log(sorted);

    let sorted = groupedPerAntId.sort(
      function (a, b) {
        return a.AntennaId - b.AntennaId;
      }
    )

    setData(sorted);
    // eslint-disable-next-line
  }, [row, allData]);

  return data.length && <Table
    columns={columns}
    data={data}
    allData={allData}
    hideExpander={true}
    allRows={true}
  />
}