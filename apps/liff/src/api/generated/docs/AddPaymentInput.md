# AddPaymentInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**payerMemberId** | **string** | 支払者のメンバーID (warikanMembersのドキュメントID) | [default to undefined]
**amount** | **number** | 支払い金額 (正の数) | [default to undefined]
**description** | **string** | 支払い内容のメモ (任意) | [optional] [default to undefined]
**participants** | **Array&lt;string&gt;** | この支払いに関与したメンバーIDのリスト (任意、指定なければ全員？) | [optional] [default to undefined]

## Example

```typescript
import { AddPaymentInput } from './api';

const instance: AddPaymentInput = {
    payerMemberId,
    amount,
    description,
    participants,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
