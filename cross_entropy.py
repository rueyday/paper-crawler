import torch
import torch.nn as nn
import numpy as np

loss = nn.CrossEntropyLoss()

y = torch.tensor([2, 0, 1])
# nsamples x nclasses = 3 x 3
y_pred_good = torch.tensor([[0.1, 1.0, 2.1], [1.0, 2.0, 0.1], [0.1, 3.0, 0.1]])
y_pred_bad = torch.tensor([[2.1, 1.0, 0.1], [0.1, 1.0, 2.1], [0.1, 3.0, 0.1]])

l1 = loss(y_pred_good, y)
l2 = loss(y_pred_bad, y)

print(l1.item())
print(l2.item())

_, predictions1 = torch.max(y_pred_good, 1)
_, predictions2 = torch.max(y_pred_bad, 1)
print(predictions1)
print(predictions2)