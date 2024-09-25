import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { AppState } from "../../../store/appState";
import { AppDispatch } from "../../../store/reduxStore";

export const useAppSelector = useSelector.withTypes<AppState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
