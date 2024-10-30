import { useAppDispatch } from "../../../../nomination-file/adapters/primary/hooks/react-redux";
import { authenticate } from "../../../core-logic/use-cases/authentication/authenticate";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

export const Login = () => {
  const dispatch = useAppDispatch();

  const authenticateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    dispatch(
      authenticate({
        email: username,
        password,
      }),
    );
  };

  return (
    <form onSubmit={authenticateUser} className="w-1/2 m-auto">
      <Input
        label="Email"
        id="username"
        nativeInputProps={{
          name: "username",
          type: "email",
        }}
      />
      <Input
        label="Mot de passe"
        id="password"
        nativeInputProps={{
          name: "password",
          type: "password",
        }}
      />
      <Button type="submit">Se connecter</Button>
    </form>
  );
};

export default Login;
