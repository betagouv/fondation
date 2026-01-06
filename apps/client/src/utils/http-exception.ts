export class HttpException extends Error {
  readonly statusCode: number;
  readonly response: Response;

  constructor(props: { response: Response }) {
    super(`HTTP Request failed with status ${props.response.status}`);

    this.statusCode = props.response.status;
    this.response = props.response;
  }
}
