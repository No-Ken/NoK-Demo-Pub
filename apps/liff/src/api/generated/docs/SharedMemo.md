# SharedMemo

共有メモのデータ構造

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Shared Memo ID | [readonly] [default to undefined]
**title** | **string** |  | [default to undefined]
**templateType** | **string** |  | [optional] [default to TemplateTypeEnum_Free]
**content** | **string** |  | [optional] [default to undefined]
**createdBy** | **string** | Creator User ID | [readonly] [default to undefined]
**groupId** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**updatedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]
**lastEditorId** | **string** |  | [optional] [readonly] [default to undefined]
**readableUserIds** | **Array&lt;string&gt;** | List of user IDs who can read/write this memo | [default to undefined]
**isArchived** | **boolean** |  | [readonly] [default to false]

## Example

```typescript
import { SharedMemo } from './api';

const instance: SharedMemo = {
    id,
    title,
    templateType,
    content,
    createdBy,
    groupId,
    createdAt,
    updatedAt,
    lastEditorId,
    readableUserIds,
    isArchived,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
