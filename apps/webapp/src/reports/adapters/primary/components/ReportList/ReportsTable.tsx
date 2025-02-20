import { Table } from "@codegouvfr/react-dsfr/Table";
import { Transparency } from "shared-models";
import {
  ReportListItemVM,
  ReportListVM,
} from "../../selectors/selectReportList";
import "./ReportsTable.css";
import { ReportStateTag } from "./ReportStateTag";

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
        <a href={report.href} onClick={report.onClick}>
          {report.name}
        </a>,
        <div>{report.grade}</div>,
        <div>{report.targettedPosition}</div>,
        <ReportStateTag state={report.state} />,
        <div>{report.observersCount}</div>,
        <div>{report.dueDate}</div>,
      ]
        .concat(transparency ? [] : [<div>{report.transparency}</div>])
        .concat([<div>{report.formation}</div>]),
    )}
  />
);
