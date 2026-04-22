from DSA import objArray


class Stack:
    def __init__(self):
        self.data = objArray(2)
        self.N = 0

    def size(self):
        return self.N

    def __resize(self, capacity):
        copy = objArray(capacity)
        for i in range(self.N):
            copy[i] = self.data[i]
        self.data = copy

    def push(self, item):
        if self.N == len(self.data):
            self.__resize(2 * len(self.data))
        self.data[self.N] = item
        self.N += 1

    def pop(self):
        if self.isEmpty():
            return None
        self.N -= 1
        item = self.data[self.N]
        if self.N > 0 and self.N == len(self.data) // 4:
            self.__resize(len(self.data) // 2)
        return item

    def top(self):
        if not self.isEmpty():
            return self.data[self.N - 1]
        return None

    def usedSpace(self):
        return 100 * self.N / len(self.data)

    def isEmpty(self):
        return self.N == 0
