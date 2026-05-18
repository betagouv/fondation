import { Storable, StorablePath, StorablePathFactory, Stored } from './storable.types';

type ObjectStorableTransactionHelper = {
  toWritable(storable: Omit<Storable, 'content'>): WritableStream;
  push(storable: Storable & { path: StorablePathFactory | StorablePath }): void;
};

// TODO: implement
export declare class ObjectStorable {
  put(storables: readonly (Storable & { path: StorablePathFactory | StorablePath })[]): Promise<Stored[]>;
  put(storables: readonly Storable[], pathFactory: StorablePathFactory): Promise<Stored[]>;
  delete(files: { id: string }[]): Promise<void>;
  publish(file: { id: string }): Promise<Stored & { url: URL }>;
  withStorage(builder: (helper: ObjectStorableTransactionHelper) => Promise<unknown>): Promise<Stored[]>;
}
