import torch

x = torch.randn(3, requires_grad=True)
print(x)

y = x + 2
print(y)

z = y * y * 2
print(z)
z = z.mean()
print(z)

z.backward()
print(x.grad)

a = torch.randn(3, requires_grad=True)

b = a + 2

c = b * b * 2

v = torch.tensor([0.1, 1.0, 0.001], dtype=torch.float32)
c.backward(v)

print(a.grad)

# x.requires_grad_(False)
d = torch.randn(3, requires_grad=True)
d.requires_grad_(False)
print(d)
# x.detach()
e = torch.randn(3, requires_grad=True)
e.detach()
print(e)
# with torch.no_grad():
f = torch.randn(3, requires_grad=True)
with torch.no_grad():
    f = f + 1
print(f)

weights = torch.ones(4, requires_grad=True)

for epoch in range(3):
    model_output = (weights*3).sum()

    model_output.backward()

    print(weights.grad)

    weights.grad.zero_()

# weights2 = torch.ones(4, requires_grad=True)
# optimizer = torch.optim.SGD(weights2, lr=0.01)
# optimizer.step()
# optimizer.zero_grad()
