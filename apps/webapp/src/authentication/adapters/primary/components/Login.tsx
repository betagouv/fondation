import { useAppDispatch } from "../../../../reports/adapters/primary/hooks/react-redux";
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
    <div id="login-layout" className="flex h-full place-items-center">
      <form onSubmit={authenticateUser} className="m-auto w-1/2">
        <Input
          label="Email"
          id="username"
          nativeInputProps={{
            name: "username",
            type: "email",
            autoCorrect: "off",
            autoCapitalize: "off",
            autoComplete: "email",
            spellCheck: false,
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
    </div>
  );
};

export default Login;
