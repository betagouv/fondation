import axios from 'axios';
import { FilesContextRestContract, interpolateUrlParams } from 'shared-models';
import {
  ReportFileService,
  reportSignedUrlsSchema,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { ReportAttachedFiles } from 'src/reports-context/business-logic/models/report-attached-files';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

type Endpoints = FilesContextRestContract['endpoints'];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], 'response'>;
};

const basePath: FilesContextRestContract['basePath'] = 'api/files';

export class HttpReportFileService implements ReportFileService {
  constructor(private readonly apiConfig: ApiConfig) {}

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
      headers: body.getHeaders(),
      timeout: 5000,
    });

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload file to File Context: ${response.statusText}`,
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
      path: ':id',
      params: { id: file.fileId },
    };
    const url = this.resolveUrl(path, params);
    await this.fetch(url, {
      method: method,
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
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
