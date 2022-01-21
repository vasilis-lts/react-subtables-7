import React, { useEffect } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, chakra } from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { useTable, usePagination, useSortBy, useGlobalFilter } from 'react-table';

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
              <Tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <Td {...cell.getCellProps()} isNumeric={cell.column.isNumeric}>
                    {cell.render('Cell')}
                  </Td>
                ))}
              </Tr>
            )
          })}
        </Tbody>
      </Table>

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