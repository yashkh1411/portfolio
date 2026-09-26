#!/usr/bin/env python3
"""Bake equirectangular Solar maps. Run once; assets ship in public/assets/solar."""
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path("/workspace/public/assets/solar")
OUT.mkdir(parents=True, exist_ok=True)


def hash2(ix, iy):
    n = np.sin(ix * 127.1 + iy * 311.7) * 43758.5453123
    return n - np.floor(n)


def vnoise(x, y):
    ix = np.floor(x)
    iy = np.floor(y)
    fx = x - ix
    fy = y - iy
    ux = fx * fx * (3 - 2 * fx)
    uy = fy * fy * (3 - 2 * fy)
    n00 = hash2(ix, iy)
    n10 = hash2(ix + 1, iy)
    n01 = hash2(ix, iy + 1)
    n11 = hash2(ix + 1, iy + 1)
    return n00 * (1 - ux) * (1 - uy) + n10 * ux * (1 - uy) + n01 * (1 - ux) * uy + n11 * ux * uy


def fbm(x, y, octaves=5, lac=2.05, gain=0.5):
    v = np.zeros_like(x)
    a = 0.5
    f = 1.0
    for _ in range(octaves):
        v += a * vnoise(x * f, y * f)
        f *= lac
        a *= gain
    return v


def sphere_xyz(size):
    u = np.linspace(0, 1, size, endpoint=False)
    v = np.linspace(0, 1, size)
    U, V = np.meshgrid(u, v)
    lon = U * np.pi * 2
    lat = (V - 0.5) * np.pi
    cl = np.cos(lat)
    return cl * np.cos(lon), np.sin(lat), cl * np.sin(lon), U, V, lat


def save_rgb(arr, path, quality=86):
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    img.save(path, "JPEG", quality=quality, optimize=True, subsampling=0)
    print(f"{path.name:18} {path.stat().st_size/1024:6.1f} KB  {img.size}")


def bake_mercury(size=1024):
    x, y, z, U, V, lat = sphere_xyz(size)
    n = fbm(x * 7.4, y * 7.4 + z * 7.4, 7)
    n2 = fbm(x * 18.0, y * 18.0 + z * 18.0, 4)
    height = (n - 0.5) * 0.22 + (n2 - 0.5) * 0.06
    albedo = 0.62 + (n - 0.5) * 0.18 + (n2 - 0.5) * 0.07

    rng = np.random.default_rng(23)
    basins = np.array([[0.22, 0.42, 0.88], [-0.74, 0.18, 0.65], [0.61, -0.55, 0.57]], dtype=np.float64)
    basins /= np.linalg.norm(basins, axis=1, keepdims=True)
    for i, p in enumerate(basins):
        r = 0.42 if i == 0 else 0.22 - i * 0.04
        d = np.arccos(np.clip(x * p[0] + y * p[1] + z * p[2], -1.0, 1.0))
        irr = 1.0 + 0.08 * np.sin(U * 18 + p[1] * 9) * np.cos(V * 14)
        rr = r * irr
        bowl = np.clip(1.0 - d / (rr * 0.78), 0, 1)
        rim = np.exp(-((d - rr) ** 2) / (2 * (rr * 0.055) ** 2))
        ejecta = np.exp(-((d / (rr * 1.55)) ** 2)) * (d > rr * 0.5)
        height -= 0.28 * bowl**1.25
        height += 0.16 * rim
        albedo += 0.07 * ejecta - 0.08 * bowl + 0.05 * rim

    count = 280
    pts = rng.normal(size=(count, 3))
    pts /= np.linalg.norm(pts, axis=1, keepdims=True)
    u = rng.random(count)
    radii = 0.012 * (0.16 / 0.012) ** (u**2.35)
    depths = 0.045 + rng.random(count) * 0.09
    for p, r, dep in zip(pts, radii, depths):
        d = np.arccos(np.clip(x * p[0] + y * p[1] + z * p[2], -1.0, 1.0))
        irr = 1.0 + 0.16 * np.sin(d * (28 + p[2] * 40) + p[0] * 12) * np.cos(d * (17 + p[1] * 22))
        rr = float(r) * irr
        inner = rr * (0.62 + 0.1 * p[1])
        bowl = np.clip(1.0 - d / np.maximum(inner, 1e-4), 0, 1)
        rim = np.exp(-((d - rr) ** 2) / (2 * (rr * 0.07) ** 2))
        ejecta = np.exp(-((d - rr * 1.08) ** 2) / (2 * (rr * 0.28) ** 2))
        height -= dep * bowl**1.45
        height += dep * 0.5 * rim
        albedo += 0.11 * ejecta * (d > inner) - 0.09 * bowl + 0.04 * rim
        if r > 0.07:
            phi = np.arctan2(x * p[2] - z * p[0], y)
            rays = np.clip(np.cos(phi * (6 + int((p[0] + 1) * 4))) ** 18, 0, 1)
            rays *= np.exp(-d / (rr * 3.4)) * (d > rr * 0.85)
            albedo += 0.09 * rays

    micro = fbm(x * 42.0, y * 42.0 + z * 42.0, 3)
    albedo += (micro - 0.5) * 0.05
    albedo = np.clip(albedo + height * 0.22, 0.22, 1.12)

    r = 132 + 96 * albedo + 18 * np.clip(height, 0, 1)
    g = 126 + 90 * albedo + 12 * np.clip(height, 0, 1)
    b = 118 + 78 * albedo + 8 * np.clip(height, 0, 1)
    save_rgb(np.dstack([r, g, b]), OUT / "mercury.jpg", 90)


if __name__ == "__main__":
    bake_mercury(1024)
