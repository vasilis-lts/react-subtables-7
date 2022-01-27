import React, { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, chakra } from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { useTable, usePagination, useSortBy, useGlobalFilter, useExpanded } from 'react-table';
import styled from 'styled-components';

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
    border-bottom: 1px solid black;
  }

  table {
    /* Make sure the inner table is always as wide as needed */
    width: 100%;
    border-spacing: 0;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      /* The secret sauce */
      /* Each cell should grow equally */
      width: 1%;
      /* But "collapsed" cells should be as small as possible */
      &.collapse {
        width: 0.0000000001%;
      }

      :last-child {
        border-right: 0;
      }
    }
  }

  .pagination {
    padding: 0.5rem;
  }`

function DynamicTable({ columns, data, loading, ...props }) {

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    // rows,
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
    state: { pageIndex, pageSize, globalFilter },

  } = useTable({
    columns,
    data,
    initialState: {
      pageIndex: 0,
      pageSize: 20
    }, // Pass our hoisted table state
  },
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination,
  )

  useEffect(() => {
    // props.dispatch({ type: actions.resetPage })
  }, [globalFilter]);

  // Render the UI for your table
  return (

    <div id="dynamicTable" className={props.className ? props.className : ""}>
      {/* {props.globalFilter ?
        <div className="flex ai-center filter-container">
          <MdSearch size={20} color={"#2196f3"} />
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter || ""}
            onChange={e => setGlobalFilter(e.target.value)}
          />
          <Button
            style={{ textTransform: "none" }}
            className="refresh"
            onClick={() => props.refresh()}
          >
            <MdRefresh size={20} color={"#4caf50"} /> Refresh</Button>
        </div>
        : null} */}
      <Styles>
        <Table {...getTableProps()}>
          <Thead>
            {headerGroups.map((headerGroup) => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <Th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    isNumeric={column.isNumeric}
                  >
                    {column.render('Header')}
                    <chakra.span pl='4'>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <TriangleDownIcon aria-label='sorted descending' />
                        ) : (
                          <TriangleUpIcon aria-label='sorted ascending' />
                        )
                      ) : null}
                    </chakra.span>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row)
              return (
                <React.Fragment key={row.getRowProps().key}>

                  <Tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <Td {...cell.getCellProps()} isNumeric={cell.column.isNumeric}>
                        {cell.render('Cell')}
                      </Td>
                    ))}
                  </Tr>
                  {row.isExpanded && <div style={{ padding: 10 }}><SubComponent row={row} allData={props.allData} /></div>}
                </React.Fragment>
              )
            })}
          </Tbody>
        </Table>
      </Styles>

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

    </div>

  )



}
export default DynamicTable;

function SubComponent(row, allData) {



  // console.log(row);
  // const filtered = allData.filter(entry => entry.SessionId === row.original.SessionId)

  const [data, setdata] = useState([]);

  useEffect(() => {
    console.log(row);
    console.log(allData);
    const filtered = row.allData.filter(entry => entry.SessionId === row.row.original.SessionId)
    setdata(filtered)
  }, []);

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
      //       {row.isExpanded ? '👇' : '👉'}
      //     </span>
      //   ),
      //   // We can override the cell renderer with a SubCell to be used with an expanded row
      //   SubCell: () => null // No expander on an expanded row
      // },
      {
        Header: 'Session Id',
        accessor: 'SessionId',
      },
      {
        Header: 'Antenna Id',
        accessor: 'AntennaId',
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

    ],
    [],
  )

  return (
    <div className='subtable'>
      <DynamicTable data={data} columns={columns} />
    </div>
  )
}