import { useEffect } from "react";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import { useAppDispatch } from "./react-redux";

export const useReportsList = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listReport());
  }, [dispatch]);
};
