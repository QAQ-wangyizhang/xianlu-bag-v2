"""原子写文件：先写临时文件再 rename，避免进程崩溃导致 JSON 写一半损坏。"""

import os
import tempfile
from pathlib import Path


def atomic_write_text(path: Path, text: str, encoding: str = "utf-8") -> None:
    """把 text 原子写入 path。

    实现：在同一目录先写临时文件并 fsync，再 os.replace 到目标路径。
    os.replace 在同一文件系统内是原子的，因此任何时刻目标文件要么是旧的完整内容、
    要么是新的完整内容，绝不会出现写一半的状态。
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding=encoding) as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, str(path))
    finally:
        # 若中途失败，临时文件可能残留，清理掉
        if os.path.exists(tmp):
            try:
                os.remove(tmp)
            except OSError:
                pass
