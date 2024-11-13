import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReportListItemVM } from "../../selectors/selectReportList";
import "./ReportsTable.css";

export type ReportsTableProps = {
  reports: ReportListItemVM[];
};

export const ReportsTable: React.FC<ReportsTableProps> = ({ reports }) => (
  <Table
    id="reports-table"
    headers={[
      "N° dossier",
      "Formation",
      "Etat",
      "Echéance",
      "Magistrat concerné",
      "Transparence",
      "Grade actuel",
      "Poste ciblé",
      "Observants",
    ]}
    bordered
    data={reports.map((report) => [
      <div>{report.folderNumber}</div>,
      <div>{report.formation}</div>,
      <div>{report.state}</div>,
      <div>{report.dueDate}</div>,
      <a href={report.href} onClick={report.onClick}>
        {report.name}
      </a>,
      <div>{report.transparency}</div>,
      <div className="text-center">{report.grade}</div>,
      <div>{report.targettedPosition}</div>,
      <div className="text-center">{report.observersCount}</div>,
    ])}
  />
);
