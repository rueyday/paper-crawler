import torch
import numpy as np

a = torch.empty(1)
a = torch.empty(2,3)

b = torch.rand(2,2)

c = torch.zeros(2,2)

d = torch.ones(2,2)
print(d.dtype)
e = torch.ones(2,2, dtype=torch.int)
print(e.dtype)
print(e.size())
f = torch.tensor([2.5, 0.1])

g = torch.rand(2,2)
h = g + b
h = torch.add(g,b)
g.add_(b)
print(g)
i = g-b
i = torch.sub(g,b)

j = g*b
j = torch.mul(g,b)

k = g/b
k = torch.div(g,b)

l = torch.rand(5,3)
print(l)
print(l[:,0])
print(l[1,:])
print(l[1,1])
print(l[1,1].item())
m = torch.rand(4,4)
n = m.view(16)
n = m.view(-1, 8)

o  = torch.ones(5)

p = o.numpy()
print(type(p))
o.add_(1)

r = np.ones(5)
s = torch.from_numpy(r)
r += 1

print(s)
if torch.cuda.is_available():
    device = torch.device("cuda")
    q = torch.ones(5, device=device)
    q = q.to(device)
    s = s.to(device)
    s = s.to("cpu")
    s = s.to(torch.float64)

t = torch.ones(5, requires_grad=True)
print(t)