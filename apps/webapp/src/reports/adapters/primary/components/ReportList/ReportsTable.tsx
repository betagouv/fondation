import { Table } from "@codegouvfr/react-dsfr/Table";
import { Transparency } from "shared-models";
import {
  ReportListItemVM,
  ReportListVM,
} from "../../selectors/selectReportList";
import "./ReportsTable.css";

export type ReportsTableProps = {
  transparency?: Transparency;
  headers: ReportListVM["headers"];
  reports: ReportListItemVM[];
};

export const ReportsTable: React.FC<ReportsTableProps> = ({
  transparency,
  headers,
  reports,
}) => (
  <Table
    id="reports-table"
    headers={headers}
    bordered
    data={reports.map((report) =>
      [
        <div>{report.folderNumber}</div>,
        <div>{report.formation}</div>,
        <div>{report.state}</div>,
        <div>{report.dueDate}</div>,
        <a href={report.href} onClick={report.onClick}>
          {report.name}
        </a>,
      ]
        .concat(transparency ? [] : [<div>{report.transparency}</div>])
        .concat([
          <div className="text-center">{report.grade}</div>,
          <div>{report.targettedPosition}</div>,
          <div className="text-center">{report.observersCount}</div>,
        ]),
    )}
  />
);
