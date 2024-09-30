import { useAppDispatch } from "../../../../nomination-case/adapters/primary/hooks/react-redux";
import { authenticate } from "../../../core-logic/use-cases/authentication/authenticate";

export const Login = () => {
  const dispatch = useAppDispatch();

  const authenticateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const form = event.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    dispatch(
      authenticate({
        username,
        password,
      })
    );
  };

  return (
    <form onSubmit={authenticateUser}>
      <input type="text" name="username" placeholder="Identifiant" />
      <input type="password" name="password" placeholder="Mot de passe" />
      <button type="submit">Se connecter</button>
    </form>
  );
};
