import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../reports/adapters/primary/hooks/react-redux";
import { authenticate } from "../../../core-logic/use-cases/authentication/authenticate";
import { selectAuthenticationFailed } from "../selectors/selectAuthenticationFailed";
import { AuthenticationFailedAlert } from "./AuthenticationFailedAlert";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";

export const Login = () => {
  const dispatch = useAppDispatch();
  const authenticationFailed = useAppSelector(selectAuthenticationFailed);

  const authenticateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    dispatch(authenticate({ email, password }));
  };

  return (
    <div id="login-layout" className="flex h-full items-center justify-center">
      <form onSubmit={authenticateUser} className="w-1/2">
        <div className={cx("fr-mb-6v")}>
          {authenticationFailed && <AuthenticationFailedAlert />}
        </div>
        <Input
          label="Email"
          id="email"
          nativeInputProps={{
            name: "email",
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
            autoCorrect: "off",
            autoCapitalize: "off",
            autoComplete: "current-password",
            spellCheck: false,
          }}
        />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
