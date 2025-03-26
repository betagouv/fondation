import axios from 'axios';
import FormData from 'form-data';
import { FilesContextRestContract, interpolateUrlParams } from 'shared-models';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import {
  FileUpload,
  ReportFileService,
  reportSignedUrlsSchema,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { ReportAttachedFiles } from 'src/reports-context/business-logic/models/report-attached-files';
import { systemRequestHeaderKey } from 'src/shared-kernel/adapters/primary/nestjs/middleware/system-request.middleware';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

type Endpoints = FilesContextRestContract['endpoints'];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], 'response'>;
};

const basePath: FilesContextRestContract['basePath'] = 'api/files';

export class HttpReportFileService implements ReportFileService {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly systemRequestSignatureProvider: SystemRequestSignatureProvider,
  ) {}

  async uploadFile(
    file: ReportAttachedFile,
    fileBuffer: Buffer,
    filePath: string[],
  ) {
    const {
      method,
      path,
      queryParams,
      body,
    }: ClientFetchOptions['uploadFile'] = {
      method: 'POST',
      path: 'upload-one',
      queryParams: {
        bucket: this.apiConfig.s3.reportsContext.attachedFilesBucketName,
        path: filePath,
        fileId: file.fileId,
      },
      body: file.generateUploadFormData(fileBuffer),
    };

    const url = this.resolveUrl(path, undefined, queryParams);
    const response = await axios.request({
      url,
      method,
      data: body,
      headers: {
        ...body.getHeaders(),
        [systemRequestHeaderKey]: this.systemRequestSignatureProvider.sign(),
      },
      timeout: 5000,
    });

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload file to File Context: ${response.statusText}`,
      );
    }
  }

  async uploadFiles(files: FileUpload[], filesPath: string[]): Promise<void> {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(({ file, buffer }) => {
      formData.append('files', buffer, file.name);
    });

    const {
      method,
      path,
      queryParams,
      body,
    }: ClientFetchOptions['uploadFiles'] = {
      method: 'POST',
      path: 'upload-many',
      queryParams: {
        bucket: this.apiConfig.s3.reportsContext.attachedFilesBucketName,
        path: filesPath,
        fileIds: files.map(({ file }) => file.fileId),
      },
      body: formData,
    };

    const url = this.resolveUrl(path, undefined, queryParams);
    const response = await axios.request({
      url,
      method,
      data: body,
      headers: {
        ...formData.getHeaders(),
        [systemRequestHeaderKey]: this.systemRequestSignatureProvider.sign(),
      },
      timeout: 10000,
    });

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload files to File Context: ${response.statusText}`,
      );
    }
  }

  async getSignedUrl(attachedFile: ReportAttachedFile) {
    const signedUrls = await this.getSignedUrls(
      new ReportAttachedFiles([attachedFile]),
    );
    if (signedUrls.length === 0) {
      throw new Error(
        `Failed to get signed URL for file: ${attachedFile.fileId}`,
      );
    }
    return signedUrls[0]!;
  }

  async getSignedUrls(attachedFiles: ReportAttachedFiles) {
    const { method, path, queryParams }: ClientFetchOptions['getSignedUrls'] = {
      method: 'GET',
      path: 'signed-urls',
      queryParams: {
        ids: attachedFiles.getFileIds(),
      },
    };
    const url = this.resolveUrl(path, undefined, queryParams);
    const response = await this.fetch(url, {
      method,
    });

    const signedUrlsData = await response.json();
    const signedUrls = reportSignedUrlsSchema.parse(signedUrlsData);
    return signedUrls;
  }

  async deleteFile(file: ReportAttachedFile) {
    const { method, path, params }: ClientFetchOptions['deleteFile'] = {
      method: 'DELETE',
      path: 'byId/:id',
      params: { id: file.fileId },
    };
    const url = this.resolveUrl(path, params);
    await this.fetch(url, {
      method: method,
    });
  }

  async deleteFiles(files: ReportAttachedFile[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const { method, path, queryParams }: ClientFetchOptions['deleteFiles'] = {
      method: 'DELETE',
      path: 'byIds',
      queryParams: {
        ids: files.map((file) => file.toSnapshot().fileId),
      },
    };

    const url = this.resolveUrl(path, undefined, queryParams);
    await this.fetch(url, {
      method,
    });
  }

  private resolveUrl(
    path: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string | string[]>,
  ): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(this.apiConfig.contextServices.filesContext.baseUrl);
    url.pathname = fullPath;
    if (queryParams) this.buildQueryParams(url, queryParams);

    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private buildQueryParams(
    url: URL,
    searchParams: Record<string, string | string[]>,
  ) {
    Object.entries(searchParams).forEach(([key, values]) => {
      if (typeof values === 'string') url.searchParams.append(key, values);
      else values.forEach((value) => url.searchParams.append(key, value));
    });
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        [systemRequestHeaderKey]: this.systemRequestSignatureProvider.sign(),
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
